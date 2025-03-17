from models.core import Setting


def load_settings() -> Setting:
    settings = Setting.objects.first()
    if not settings:
        settings = Setting()
        settings.save()
    return settings
