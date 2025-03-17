from datetime import datetime
from http import HTTPStatus
from typing import Optional
import os
import signal
import traceback


def my_unauthz_handler(func_name: Optional[str], params: Optional[list[str]]):
    return "User doesn't have the required permissions.", HTTPStatus.FORBIDDEN


def my_unauth_handler(mechanisms: list[str], headers: Optional[dict[str, str]]):
    return "Please authenticate first.", HTTPStatus.UNAUTHORIZED


def shutdown_server():
    gunicorn_pid = os.getppid()
    os.kill(gunicorn_pid, signal.SIGTERM)


def exception_handler(func):
    def inner_function(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception:
            print(traceback.format_exc())

    return inner_function


def handle_custom_types(obj: dict):
    for key, value in obj.items():
        if isinstance(value, datetime):
            obj[key] = value.strftime("%Y-%m-%dT%H:%M:%S.000Z")
