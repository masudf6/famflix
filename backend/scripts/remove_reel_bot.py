from sqlalchemy import or_

from app.db import SessionLocal
from app.models.user import User
from app.models.chat import ChatMessage, ChatMention, ChatReadState


def main() -> None:
    db = SessionLocal()
    try:
        bots = (
            db.query(User)
            .filter(
                or_(
                    User.role == "bot",
                    User.email == "reel.bot@famflix.local",
                    User.display_name.ilike("%reel%"),
                    User.full_name.ilike("%reel%"),
                )
            )
            .all()
        )

        if not bots:
            print("No reel/bot users found.")
            return

        bot_ids = [b.id for b in bots]
        print(f"Found bot users: {[b.email for b in bots]}")

        # Delete chat mentions for messages authored by bots
        subq = db.query(ChatMessage.id).filter(ChatMessage.author_id.in_(bot_ids))
        deleted_mentions_msgs = db.query(ChatMention).filter(ChatMention.message_id.in_(subq)).delete(synchronize_session=False)

        # Delete mentions that reference the bot as a mentioned user
        deleted_mentions_users = db.query(ChatMention).filter(ChatMention.mentioned_user_id.in_(bot_ids)).delete(synchronize_session=False)

        # Delete chat messages authored by bots
        deleted_messages = db.query(ChatMessage).filter(ChatMessage.author_id.in_(bot_ids)).delete(synchronize_session=False)

        # Delete read states for bot users
        deleted_readstates = db.query(ChatReadState).filter(ChatReadState.user_id.in_(bot_ids)).delete(synchronize_session=False)

        # Delete the bot users themselves
        deleted_users = db.query(User).filter(User.id.in_(bot_ids)).delete(synchronize_session=False)

        db.commit()

        print(
            f"Deleted mentions(from bot messages)={deleted_mentions_msgs}, mentions(by user)={deleted_mentions_users}, messages={deleted_messages}, readstates={deleted_readstates}, users={deleted_users}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
