from http import HTTPStatus
from flask import Blueprint, request, jsonify
from flask import current_app as app
from flask_security.utils import hash_password
from flask_security.mail_util import MailUtil, EmailValidateException
from pymongo.errors import ConnectionFailure

from api import response
from extensions import user_datastore as datastore
from models.rule import Rule
from models.core import User, Role, Roles
from utils.handlers import shutdown_server

setup_api = Blueprint("setup", __name__)


@setup_api.route("/setup/status")
def get_health():
    elasticsearch_status = ""
    mongo_status = ""

    try:
        app.elastic.get_all_indices()
    except Exception as e:
        elasticsearch_status = "Elasticsearch is unreachable."

    try:
        Rule.objects.count()
    except ConnectionFailure:
        mongo_status = "Failed to connection to the database."
    except:
        mongo_status = "Something went wrong."

    result = {
        "elasticsearch": {
            "status": len(elasticsearch_status) == 0,
            "message": elasticsearch_status,
        },
        "mongodb": {"status": len(mongo_status) == 0, "message": mongo_status},
    }
    return jsonify(result)


@setup_api.route("/setup", methods=["POST"])
def setup_instance():
    with app.app_context():
        if not request.is_json:
            return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

        data = request.get_json()

        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not (username or email or password):
            return response("Incorrect credential parameters."), HTTPStatus.BAD_REQUEST

        try:
            email = MailUtil(app).normalize(email)

            if User.objects.count() > 0:
                return response("Instance already initialized."), HTTPStatus.FORBIDDEN

            for role in [r.value for r in Roles]:
                datastore.find_or_create_role(name=role)

            datastore.create_user(
                username=username,
                email=email,
                password=hash_password(password),
                roles=[Roles.ADMINISTRATOR],
            )
            shutdown_server()
            return response("Administrator account created."), HTTPStatus.OK
        except EmailValidateException:
            return response("Email not valid."), HTTPStatus.BAD_REQUEST
        except Exception:
            return response("Something went wrong."), HTTPStatus.BAD_REQUEST
