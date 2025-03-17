from flask import Blueprint
from flask_security.decorators import auth_required

api = Blueprint("api", __name__)


@api.before_request
@auth_required("session")
def is_authenticated():
    """Requires authentication for api access"""
    pass


################## User Endpoints ##################
from .user import *

################## ATT&CK Endpoints ##################
from .attack import *

################## Rule Endpoints ##################
from .rule import *

################## Asset Endpoints ##################
from .assets import *

################## Baseline Endpoints ##################
from .baseline import *

################## Management Endpoints ##################
from .management import *

################## Alert Endpoints ##################
from .alert import *

################## Fields Endpoints ##################
from .fields import *

################## Statistics Endpoints ##################
from .stats import *
