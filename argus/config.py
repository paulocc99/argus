from dotenv import load_dotenv, set_key, find_dotenv, dotenv_values
import secrets
import os

from utils import get_config_path

env_file = find_dotenv(os.path.join(get_config_path(), f".env"))
env_values = dotenv_values(env_file)

if not env_values.get("SECRET_KEY"):
    set_key(env_file, "SECRET_KEY", str(secrets.token_urlsafe()))

if not env_values.get("SECURITY_PASSWORD_SALT"):
    set_key(
        env_file, "SECURITY_PASSWORD_SALT", str(secrets.SystemRandom().getrandbits(128))
    )
load_dotenv(env_file)


class Config:
    SCHEDULER_API_ENABLED = False
    SCHEDULER_EXECUTORS = {"default": {"type": "threadpool", "max_workers": 30}}
    ELASTIC_HOST = os.environ.get("ELASTIC_HOST")
    ELASTIC_USER = os.environ.get("ELASTIC_USER")
    ELASTIC_PASS = os.environ.get("ELASTIC_PASS")
    ELASTIC_API_KEY = os.environ.get("ELASTIC_API_KEY")
    MONGO_SETTINGS = {
        "db": os.environ.get("MONGO_INITDB_DATABASE", "argus"),
        "host": os.environ.get("MONGO_HOST", "mongodb"),
        "port": int(os.environ.get("MONGO_PORT", 27017)),
        "username": os.environ.get("DATABASE_USERNAME"),
        "password": os.environ.get("DATABASE_PASSWORD"),
        "authentication_source": os.environ.get("MONGO_INITDB_DATABASE", "argus"),
    }
    GITHUB_KEY = os.environ.get("GITHUB_KEY")
    SECRET_KEY = os.environ.get("SECRET_KEY")
    # flask-security
    SECURITY_URL_PREFIX = "/api/auth"
    SECURITY_FLASH_MESSAGES = False
    SECURITY_RETURN_GENERIC_RESPONSES = True
    SECURITY_USERNAME_ENABLE = True
    SECURITY_PASSWORD_HASH = os.environ.get("SECURITY_PASSWORD_HASH", "bcrypt")
    SECURITY_PASSWORD_SALT = os.environ.get("SECURITY_PASSWORD_SALT", "")
    SECURITY_REDIRECT_BEHAVIOR = "spa"
    SECURITY_LOGIN_URL = "/login"
    SECURITY_CSRF_COOKIE_NAME = "XSRF-TOKEN"
    WTF_CSRF_CHECK_DEFAULT = False
    WTF_CSRF_TIME_LIMIT = None
    ATTACK_MITRE_VERSION = os.environ.get("ATTACK_MITRE_VERSION", "15.1")


config = Config()
