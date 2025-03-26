from flask import request, jsonify, Blueprint
from flask import current_app as app
from flask_security.decorators import roles_required 
from mongoengine.errors import NotUniqueError, ValidationError
from benedict import benedict
from http import HTTPStatus
import math
import yaml

from api import response
from constants import MAX_PER_PAGE
from extensions import rule_feed
from models.core import Datasource, Roles
from models.management import SigmaRepository, SigmaRuleMetadata
from utils import to_dict


mgmt = Blueprint("health", __name__, url_prefix="/management")

@mgmt.before_request
@roles_required(Roles.ADMINISTRATOR)
def is_administrator():
    pass

################## Datasources ##################
@mgmt.route("/datasources")
def get_datasources():
    result = []
    datasources = Datasource.objects.all()
    for ds in datasources:
        data = to_dict(ds)
        count = 0
        for i in ds.indices:
            try:
                count += app.elastic.indice_count(index=i)
            except:
                pass
        data["events"] = count
        result.append(data)

    return jsonify(result)


@mgmt.route("/datasources", methods=["POST"])
def create_datasource():
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()

    indices = data.get("indices", [])
    if any(i.strip().lower() for i in indices if not (i and app.elastic.indice_exists(i) and i != "baseline")):
        return response("The provided indices do not exist."), HTTPStatus.BAD_REQUEST

    try:
        datasource = Datasource(
            name=data.get("name"),
            indices=indices,
            module=data.get("module"),
            lock=data.get("lock"),
        )
        datasource.validate()
        datasource.save()
    except NotUniqueError:
        return response("Can't created duplicated datasources."), HTTPStatus.BAD_REQUEST
    except ValidationError as e:
        return response(e.message), HTTPStatus.BAD_REQUEST
    except:
        return response("Invalid parameters"), HTTPStatus.BAD_REQUEST

    return response("Datasource created.")


@mgmt.route("/datasources/<name>", methods=["PUT"])
def update_datasource(name):
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()
    datasource = Datasource.by_name(name=name)
    if not datasource:
        return response("Datasource not found"), HTTPStatus.NOT_FOUND

    indices = data.get("indices", [])
    if any(indice for indice in indices if not app.elastic.indice_exists(indice)):
        return response("The provided indices do not exist."), HTTPStatus.BAD_REQUEST

    try:
        datasource.indices = indices
        datasource.module = data.get("module")
        datasource.lock = data.get("lock")
        datasource.save()
    except ValidationError as e:
        return response(e.message), HTTPStatus.BAD_REQUEST
    except Exception as e:
        return response("Invalid parameters"), HTTPStatus.FORBIDDEN

    return response("Datasource updated.")


@mgmt.route("/datasources/<name>", methods=["DELETE"])
def delete_datasource(name):
    if name.strip().lower() == "baseline":
        return (
            response("The baseline datasource can't be deleted."),
            HTTPStatus.BAD_REQUEST,
        )

    datasource = Datasource.by_name(name=name)
    if not datasource:
        return response("Datasource not found"), HTTPStatus.NOT_FOUND

    try:
        datasource.delete()
    except:
        return response("Error on datasource deletion"), HTTPStatus.BAD_REQUEST
    return response("Datasource deleted.")


@mgmt.route("/datasources/scan", methods=["POST"])
def automatic_datasource_resolver():
    available_indices = app.elastic.get_all_data_streams()
    count = 0

    for indice in available_indices:
        ds = Datasource.by_indice(indice)
        if any([d.lock for d in ds]):
            continue

        modules = app.elastic.search_by_fields2(fields=["event.module"], index=indice)
        for module in modules:
            if Datasource.by_module(module).count():
                continue
            ds = Datasource(name=module, indices=[indice], module=module)
            ds.save()
            count += 1
    return response(f"{count} datasources were found.")


################## Sigma Repos ##################
@mgmt.route("/sigma")
def get_sigma_repositories():
    result = []
    repos = SigmaRepository.objects.all()
    for repo in repos:
        r = to_dict(repo)
        count = SigmaRuleMetadata.objects(repository=repo).count()
        r["count"] = count
        result.append(r)

    return jsonify(result)


@mgmt.route("/sigma", methods=["POST"])
def create_sigma_repository():
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()
    try:
        repo = SigmaRepository(
            name=data.get("name"),
            repository=data.get("repository").lower(),
            mappings=data.get("mappings"),
        )
        repo.save()
    except NotUniqueError:
        return response("Can't create duplicated repositories."), HTTPStatus.BAD_REQUEST
    except:
        return response("Invalid parameters"), HTTPStatus.BAD_REQUEST

    return response("Sigma repository created"), HTTPStatus.CREATED


@mgmt.route("/sigma/<repo_id>", methods=["PUT"])
def update_sigma_repository(repo_id):
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()
    repo = SigmaRepository.by_uuid(uuid=repo_id)
    if not repo:
        return response("Sigma repository not found"), HTTPStatus.NOT_FOUND
    try:
        repo.name = data.get("name")
        repo.mappings = data.get("mappings")
        repo.save()
    except:
        return response("Error on repository update."), HTTPStatus.BAD_REQUEST
    return response("Sigma repository updated")


@mgmt.route("/sigma/<repo_id>", methods=["DELETE"])
def delete_sigma_repository(repo_id):
    repo = SigmaRepository.by_uuid(uuid=repo_id)
    if not repo:
        return response("Sigma repository not found"), HTTPStatus.NOT_FOUND

    # rules = SigmaRuleMetadata.objects(repository=repo).all()
    rules = SigmaRuleMetadata.by_repository(repository=repo)
    try:
        if rules:
            for rule in rules:
                rule.delete()
        repo.delete()
    except:
        return response("Error on repository deletion"), HTTPStatus.BAD_REQUEST
    return response("Sigma repository deleted")


@mgmt.route("/sigma/<repo_id>/sync", methods=["POST"])
def sync_sigma_repository(repo_id):
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    repo = SigmaRepository.by_uuid(uuid=repo_id)
    if not repo:
        return response("Sigma repository not found"), HTTPStatus.NOT_FOUND

    ## TODO - Add background task to proccess repository rules
    rule_feed.process_repository_rules(repo)
    try:
        repo.processed = True
        repo.save()
    except:
        return response("Error on repository sync"), HTTPStatus.BAD_REQUEST
    return response("Sigma repository sync started")


@mgmt.route("/sigma/<repo_id>/clear", methods=["POST"])
def clear_sigma_repository_rules(repo_id):
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    repo = SigmaRepository.by_uuid(uuid=repo_id)
    if not repo:
        return response("Sigma repository not found"), HTTPStatus.NOT_FOUND

    rules = SigmaRuleMetadata.by_repository(repository=repo)
    try:
        for rule in rules:
            rule.delete()
    except:
        return response("Error on rule deletion"), HTTPStatus.BAD_REQUEST

    try:
        repo.update(processed=False)
    except:
        return response("Error on clearing repository"), HTTPStatus.BAD_REQUEST
    return response("Sigma repository rules cleared.")


################## Pipelines ##################
@mgmt.route("/pipelines")
def get_ingest_pipelines():
    page = request.args.get("page", type=int, default=None)
    if page and page < 0:
        return response("Invalid page value"), HTTPStatus.BAD_REQUEST

    try:
        result = app.elastic.search_pipeline()
    except:
        return response("Error on pipeline retrieval"), HTTPStatus.BAD_REQUEST

    if page:
        return jsonify(
            {
                "pipelines": result[
                    ((page - 1) * MAX_PER_PAGE) : (page * MAX_PER_PAGE)
                ],
                "size": len(result),
                "pages": math.ceil(len(result) / MAX_PER_PAGE),
            }
        )
    return jsonify(result)


@mgmt.route("/pipelines/upload", methods=["POST"])
def upload_ingest_pipeline():
    if "pipeline" not in request.files:
        return response("Please upload an pipeline"), HTTPStatus.BAD_REQUEST

    data = request.files["pipeline"].read()
    pipeline_data = yaml.safe_load(data)
    pipeline = benedict(pipeline_data, keypath_separator=".")

    return jsonify(pipeline)


@mgmt.route("/pipelines", methods=["POST"])
def update_ingest_pipeline():
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()
    result = app.elastic.update_pipeline(
        p_id=data.get("id"),
        description=data.get("description"),
        processors=data.get("processors", []),
        on_failure=data.get("on_failure", []),
    )

    if not result["acknowledged"]:
        return response("Failed update"), HTTPStatus.BAD_REQUEST

    return response("Pipeline updated")


@mgmt.route("/pipelines/<pipeline_id>", methods=["DELETE"])
def delete_ingest_pipeline(pipeline_id):
    try:
        result = app.elastic.delete_pipeline(pipeline_id)

        if not result["acknowledged"]:
            return response("Failed update"), HTTPStatus.BAD_REQUEST
    except:
        return response("Error on pipeline delete"), HTTPStatus.BAD_REQUEST
    return jsonify("Pipeline deleted")
