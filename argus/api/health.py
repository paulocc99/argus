from flask import Blueprint

from api import response

health = Blueprint("health", __name__)


@health.route("/")
def server_health():
    return response("OK")
