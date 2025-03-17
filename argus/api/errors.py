from http import HTTPStatus
from flask import Blueprint
from api import response

errors = Blueprint("errors", __name__)


@errors.errorhandler(404)
def not_found(error):
    return response("404 Not Found"), HTTPStatus.NOT_FOUND


@errors.errorhandler(403)
def forbidden(error):
    return response("403 Forbidden"), HTTPStatus.FORBIDDEN


@errors.errorhandler(400)
def bad_request(error):
    return response("400 Bad Request"), HTTPStatus.BAD_REQUEST


@errors.errorhandler(Exception)
def handle_error(error):
    message = (
        error.description
        if hasattr(error, "description")
        else [str(x) for x in error.args]
    )
    response = {"error": {"type": error.__class__.__name__, "message": message}}
    return response, error.code if hasattr(error, "code") else 500
