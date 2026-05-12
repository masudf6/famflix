from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def _columns(engine: Engine, table_name: str) -> set[str]:
    inspector = inspect(engine)
    try:
        return {column["name"] for column in inspector.get_columns(table_name)}
    except Exception:
        return set()


def ensure_runtime_columns(engine: Engine) -> None:
    """Small dev-friendly schema updater for projects without Alembic yet.

    `Base.metadata.create_all()` creates new tables, but it does not add columns to
    existing tables. These guarded ALTERs keep local/dev deployments working after
    adding profile and media metadata fields.
    """

    dialect = engine.dialect.name
    user_columns = _columns(engine, "users")
    media_columns = _columns(engine, "media")
    chat_message_columns = _columns(engine, "chat_messages")

    users_additions: list[tuple[str, str]] = []
    if "display_name" not in user_columns:
        users_additions.append(("display_name", "VARCHAR(100)"))

    media_additions: list[tuple[str, str]] = []
    if "release_year" not in media_columns:
        media_additions.append(("release_year", "INTEGER"))
    if "rating" not in media_columns:
        media_additions.append(("rating", "VARCHAR(20)"))
    if "audience_rating" not in media_columns:
        media_additions.append(("audience_rating", "VARCHAR(50)"))
    if "genres" not in media_columns:
        media_additions.append(("genres", "JSONB" if dialect == "postgresql" else "JSON"))
    if "tags" not in media_columns:
        media_additions.append(("tags", "JSONB" if dialect == "postgresql" else "JSON"))
    if "thumbnail_s3_key" not in media_columns:
        media_additions.append(("thumbnail_s3_key", "TEXT"))

    chat_message_additions: list[tuple[str, str]] = []
    if "media_ids" not in chat_message_columns:
        chat_message_additions.append(("media_ids", "JSONB" if dialect == "postgresql" else "JSON"))

    with engine.begin() as conn:
        for column_name, column_type in users_additions:
            conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
        for column_name, column_type in media_additions:
            conn.execute(text(f"ALTER TABLE media ADD COLUMN {column_name} {column_type}"))
        for column_name, column_type in chat_message_additions:
            conn.execute(text(f"ALTER TABLE chat_messages ADD COLUMN {column_name} {column_type}"))

        # Media visibility is intentionally simple for FamFlix:
        # every authenticated user can see every media item. Keep existing
        # dev records aligned with that rule, even if older rows were private.
        if "is_public" in media_columns:
            conn.execute(text("UPDATE media SET is_public = TRUE WHERE is_public IS NOT TRUE"))
