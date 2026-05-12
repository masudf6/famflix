import json
import logging
import os
import re
from typing import Any
from uuid import UUID

from openai import OpenAI
from sqlalchemy.orm import Session

from app.models.chat import ChatMessage
from app.models.user import User
from app.services.agent_tools import get_media_catalog
from app.services.fam_bot_service import FAM_BOT_EMAIL
from app.services.realtime import realtime_manager

logger = logging.getLogger(__name__)

client = OpenAI()

AGENT_MODEL = os.getenv("OPENAI_AGENT_MODEL", "gpt-5.5")
MAX_TOOL_ROUNDS = 4
DEFAULT_HISTORY_LIMIT = 30


TOOLS: list[dict[str, Any]] = [
    {
        "type": "function",
        "name": "get_media_catalog",
        "description": (
            "Get the FamFlix media catalogue from the database. Returns media titles, "
            "descriptions, types, thumbnails, genres, tags, ratings, file data, and URLs. "
            "Use this when the user asks what is available in FamFlix, wants a local "
            "recommendation, asks for something to watch, asks whether a title exists in "
            "the local app, or asks for a FamFlix link."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of media items to return. Use 100 unless the user asks for a small list.",
                }
            },
            "required": ["limit"],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "web_search",
    },
]


INSTRUCTIONS = """
You are Fam, the FamFlix assistant.

Users talk to you from the family chat by mentioning @fam.
You are inside the FamFlix family room, not a detached chatbot.

You can answer normally, or you can use tools.

You will receive room context with:
- the current user
- active family room members
- what people are currently watching, if available
- recent chat history
- the user's latest request to Fam

Use the room context to understand follow-up questions, references like "that one", "what did you suggest", "what is everyone watching", and prior recommendations.
Do not repeat the whole room context back to the user.

You have two tools:

1. get_media_catalog
This gives you the local FamFlix media catalogue.
Use it when the user asks about:
- what is available in FamFlix
- what they should watch
- recommendations from the app
- whether a title exists locally
- movies, series, videos, genres, tags, ratings, or watch links in FamFlix

The database tool only returns data.
You must decide what is relevant.

2. web_search
Use this when the user asks about:
- current or trending movies
- latest releases
- actor/director information
- reviews
- movie background
- popularity
- anything outside the local FamFlix database

Use both tools when useful.

Examples:
- "What should I watch tonight?"
  Use get_media_catalog.

- "Do we have any comedy movies?"
  Use get_media_catalog.

- "What movies are trending right now?"
  Use web_search.

- "What trending movies are similar to what we have in FamFlix?"
  Use web_search, then get_media_catalog.

- "Recommend something like Dune from our library."
  Use get_media_catalog. Use web_search only if you need external context about Dune.

Rules:
- Do not invent FamFlix titles.
- If recommending from FamFlix, only recommend items returned by get_media_catalog.
- If nothing matches in FamFlix, say that clearly.
- If you use web information, separate that from what is actually available in FamFlix.
- Never paste raw tool data, JSON, database rows, file objects, s3_key values, UUIDs, or internal metadata in your answer.
- Do not expose stream_url or download_url unless the user explicitly asks for a direct stream/download link.
- For normal recommendations, return the chosen local media IDs in media_ids. The frontend will render clickable media cards.
- Keep the answer short, friendly, and practical.

Final response format:
Return ONLY valid JSON with this exact shape:
{
  "answer": "Natural chat answer for the user. No raw JSON or raw database fields.",
  "media_ids": ["IDs of FamFlix media items you selected, or empty list"]
}
"""


UUID_RE = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)


def _display_name(user: User) -> str:
    return user.display_name or user.full_name or user.email.split("@", 1)[0]


def _handle(user: User) -> str:
    source = user.display_name or user.full_name or user.email.split("@", 1)[0]
    handle = re.sub(r"[^a-z0-9_]+", "", source.lower().replace(" ", "_"))
    if not handle:
        handle = re.sub(r"[^a-z0-9_]+", "", user.email.split("@", 1)[0].lower())
    return handle or f"user_{str(user.id)[:8]}"


def clean_agent_query(user_query: str) -> str:
    cleaned = re.sub(r"(?i)(^|\s)@fam\b", " ", user_query or "").strip()
    return " ".join(cleaned.split()) or (user_query or "").strip()


def _dump_tool_output(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, default=str)


def _run_get_media_catalog(db: Session, arguments: str) -> dict[str, Any]:
    try:
        args = json.loads(arguments or "{}")
    except json.JSONDecodeError:
        return {"error": "Invalid JSON arguments for get_media_catalog.", "items": []}

    try:
        limit = int(args.get("limit", 100))
    except (TypeError, ValueError):
        limit = 100

    return get_media_catalog(db=db, limit=limit)


def _loads_jsonish(raw: str) -> dict[str, Any]:
    text = raw.strip()

    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text).strip()

    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            parsed = json.loads(text[start : end + 1])
            return parsed if isinstance(parsed, dict) else {}
        raise


def _parse_final_output(output_text: str) -> dict[str, Any]:
    raw = (output_text or "").strip()

    try:
        parsed = _loads_jsonish(raw)
    except (json.JSONDecodeError, ValueError):
        # Fallback: do not show UUIDs as ugly raw data, but keep any IDs for cards.
        media_ids = UUID_RE.findall(raw)
        cleaned = UUID_RE.sub("", raw).strip()
        cleaned = re.sub(r"```(?:json)?|```", "", cleaned, flags=re.IGNORECASE).strip()
        cleaned = cleaned or "I found a result, but I could not format the response cleanly."
        return {"answer": cleaned, "media_ids": media_ids}

    answer = str(parsed.get("answer") or "").strip()
    raw_ids = parsed.get("media_ids") or []
    media_ids = [str(item) for item in raw_ids if isinstance(item, str)]

    if not answer:
        answer = "I could not find a clear answer for that."

    return {"answer": answer, "media_ids": media_ids}


def _message_is_allowed_bot(author: User) -> bool:
    return author.role != "bot" or author.email == FAM_BOT_EMAIL


def _get_recent_messages(
    db: Session,
    source_message_id: UUID | None = None,
    limit: int = DEFAULT_HISTORY_LIMIT,
) -> list[ChatMessage]:
    query = db.query(ChatMessage).join(User, User.id == ChatMessage.author_id).filter(User.is_active.is_(True))

    # Keep Fam's own previous replies, but avoid old/other bot noise.
    query = query.filter((User.role != "bot") | (User.email == FAM_BOT_EMAIL))

    if source_message_id:
        source_message = db.query(ChatMessage).filter(ChatMessage.id == source_message_id).first()
        if source_message:
            query = query.filter(ChatMessage.created_at <= source_message.created_at)

    rows = query.order_by(ChatMessage.created_at.desc()).limit(limit).all()
    return list(reversed(rows))


def _author_map(db: Session, messages: list[ChatMessage]) -> dict[UUID, User]:
    ids = {message.author_id for message in messages}
    if not ids:
        return {}
    rows = db.query(User).filter(User.id.in_(ids)).all()
    return {row.id: row for row in rows}


def _build_room_context(
    db: Session,
    current_user: User | None,
    source_message_id: UUID | None = None,
    history_limit: int = DEFAULT_HISTORY_LIMIT,
) -> dict[str, Any]:
    active_users = (
        db.query(User)
        .filter(
            User.is_active.is_(True),
            ((User.role != "bot") | (User.email == FAM_BOT_EMAIL)),
        )
        .order_by(User.role.desc(), User.full_name.asc())
        .all()
    )

    members: list[dict[str, Any]] = []
    for user in active_users:
        is_bot = user.role == "bot"
        presence = realtime_manager.get_status(user.id)
        members.append(
            {
                "name": _display_name(user),
                "handle": _handle(user),
                "role": user.role,
                "is_bot": is_bot,
                "is_current_user": bool(current_user and user.id == current_user.id),
                "online": True if is_bot else bool(presence.online),
                "watching_title": None if is_bot else presence.watching_title,
                "watching_media_id": None if is_bot else presence.watching_media_id,
            }
        )

    messages = _get_recent_messages(db, source_message_id=source_message_id, limit=history_limit)
    authors = _author_map(db, messages)

    history: list[dict[str, Any]] = []
    for message in messages:
        author = authors.get(message.author_id)
        if not author or not _message_is_allowed_bot(author):
            continue
        text = (message.text or "").strip()
        if len(text) > 1000:
            text = f"{text[:1000]}..."
        history.append(
            {
                "author": _display_name(author),
                "handle": _handle(author),
                "is_bot": author.role == "bot",
                "created_at": message.created_at.isoformat() if message.created_at else None,
                "text": text,
                "media_ids": message.media_ids or [],
            }
        )

    return {
        "room": "FamFlix family room",
        "current_user": {
            "name": _display_name(current_user),
            "handle": _handle(current_user),
        }
        if current_user
        else None,
        "members": members,
        "recent_messages": history,
    }


def _build_agent_user_content(clean_query: str, room_context: dict[str, Any]) -> str:
    return (
        "ROOM CONTEXT JSON:\n"
        f"{json.dumps(room_context, ensure_ascii=False, default=str)}\n\n"
        "USER'S LATEST REQUEST TO FAM:\n"
        f"{clean_query}\n\n"
        "Answer the latest request using the room context when relevant. "
        "Remember to return only the required JSON object."
    )


def run_agent(
    db: Session,
    user_query: str,
    current_user: User | None = None,
    source_message_id: UUID | None = None,
) -> dict[str, Any]:
    clean_query = clean_agent_query(user_query)

    if not clean_query:
        return {
            "answer": "Ask me what you want to watch, or ask about something in FamFlix.",
            "media_ids": [],
        }

    room_context = _build_room_context(
        db=db,
        current_user=current_user,
        source_message_id=source_message_id,
    )

    input_items: list[Any] = [
        {
            "role": "user",
            "content": _build_agent_user_content(clean_query, room_context),
        }
    ]

    response = client.responses.create(
        model=AGENT_MODEL,
        instructions=INSTRUCTIONS,
        tools=TOOLS,
        tool_choice="auto",
        input=input_items,
    )

    for _ in range(MAX_TOOL_ROUNDS):
        input_items += response.output

        function_calls = [
            item
            for item in response.output
            if getattr(item, "type", None) == "function_call"
        ]

        if not function_calls:
            break

        for item in function_calls:
            if item.name == "get_media_catalog":
                result = _run_get_media_catalog(db=db, arguments=item.arguments)
            else:
                result = {"error": f"Unknown tool call: {item.name}"}

            input_items.append(
                {
                    "type": "function_call_output",
                    "call_id": item.call_id,
                    "output": _dump_tool_output(result),
                }
            )

        response = client.responses.create(
            model=AGENT_MODEL,
            instructions=INSTRUCTIONS,
            tools=TOOLS,
            tool_choice="auto",
            input=input_items,
        )

    return _parse_final_output(response.output_text or "")
