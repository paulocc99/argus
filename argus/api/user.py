from flask import request, jsonify
from flask_login import current_user
from flask_security.utils import (
    hash_password,
    password_complexity_validator,
    password_length_validator,
)
from http import HTTPStatus

from api.routes import api
from api import response
from models.core import User


@api.route("/me")
def get_user():
    data = {
        "username": current_user.username,
        "email": current_user.email,
    }
    return jsonify(data)


@api.route("/me/password", methods=["POST"])
def update_user_password():
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()
    if not list(data.keys()) == ["password", "new_password", "confirmation"]:
        return response("Missing attributes."), HTTPStatus.BAD_REQUEST

    password = data.get("password")
    new_password = data.get("new_password")
    confirmation = data.get("confirmation")

    if new_password != confirmation:
        return response("New password does not match."), HTTPStatus.BAD_REQUEST

    if not current_user.verify_and_update_password(password):
        return response("Incorrect password."), HTTPStatus.BAD_REQUEST

    if password_length_validator(new_password) or password_complexity_validator(
        new_password, False
    ):
        return response("Insufficient password complexity."), HTTPStatus.BAD_REQUEST

    password_hash = hash_password(new_password)
    user = User.objects(username=current_user.username).first()
    user.password = password_hash
    user.save()

    return response("Password changed.")
