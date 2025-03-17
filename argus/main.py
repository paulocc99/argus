from flask import Flask
from flask_security.core import Security
import flask_wtf

from extensions import (
    scheduler,
    engine_scheduler,
    elastic,
    baseline,
    settings,
    config,
    user_datastore,
)
from utils.handlers import my_unauth_handler, my_unauthz_handler
from api.routes import api
from api.health import health
from api.errors import errors
from models.core import User
from config import config
import initialize


def create_app():
    app = Flask(__name__)
    app.config.from_object(config)
    flask_wtf.CSRFProtect(app)

    app.elastic = elastic
    app.baseline = baseline
    app.settings = settings
    app.scheduler = engine_scheduler

    security = Security(app, user_datastore)
    security.unauthz_handler(my_unauthz_handler)
    security.unauthn_handler(my_unauth_handler)

    if User.objects.count() > 0:
        app.register_blueprint(api, url_prefix="/api")
        app.register_blueprint(health, url_prefix="/api/health")
        app.register_blueprint(errors)
        scheduler.init_app(app)

        with app.app_context():
            import jobs
            import models

            scheduler.start()
    else:
        initialize.setup(app, config)

    return app


app = create_app()
