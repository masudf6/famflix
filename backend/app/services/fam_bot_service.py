from sqlalchemy.orm import Session

from app.models.user import User

FAM_BOT_EMAIL = "fam@famflix.local"
FAM_BOT_NAME = "Fam"
FAM_BOT_DISPLAY_NAME = "Fam"


def get_or_create_fam_bot(db: Session) -> User:
    """Return the single Fam assistant user used to persist agent chat replies."""

    bot = db.query(User).filter(User.email == FAM_BOT_EMAIL).first()
    if bot:
        changed = False
        if bot.full_name != FAM_BOT_NAME:
            bot.full_name = FAM_BOT_NAME
            changed = True
        if bot.display_name != FAM_BOT_DISPLAY_NAME:
            bot.display_name = FAM_BOT_DISPLAY_NAME
            changed = True
        if bot.role != "bot":
            bot.role = "bot"
            changed = True
        if not bot.is_active:
            bot.is_active = True
            changed = True
        if changed:
            db.add(bot)
            db.commit()
            db.refresh(bot)
        return bot

    bot = User(
        full_name=FAM_BOT_NAME,
        display_name=FAM_BOT_DISPLAY_NAME,
        email=FAM_BOT_EMAIL,
        password_hash="not-used-for-bot-user",
        role="bot",
        is_active=True,
    )
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot
