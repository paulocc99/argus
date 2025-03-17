from flask import request, jsonify
from flask import current_app as app
from elasticsearch.exceptions import BadRequestError
from mongoengine import ValidationError
from http import HTTPStatus
import math

from api.routes import api
from api import response
from constants import MAX_PER_PAGE, RISK_LOOKUP
from models.core import Datasource
from models.rule import (
    Rule,
    RuleOrigin,
    RuleTrigger,
    RuleTriggerType,
    ThresholdRule,
    EQLRule,
    RuleType,
    RuleTrigger,
    RuleTriggerType,
    RuleATTACK,
)
from models.alert import AlertType
from models.management import SigmaRuleMetadata
from extensions import rule_feed, attack
from utils import parse_str_bool, to_dict
from utils.extractor import (
    extract_sigma_rule_data,
    convert_sigma_to_eql_query,
    get_event_day_count,
)
from utils.filter import clean_attrs

base_attrs = [
    "name",
    "description",
    "risk",
    "trigger",
    "timeframe",
    "datasources",
    "attack",
    "intelligence",
    "type",
]
threshold_attrs = ["group_by", "filters", "conditions"]
eql_attrs = ["query", "type_alert"]


@api.route("/rules")
def get_rules():
    page = request.args.get("page", type=int, default=None)
    active = request.args.get("active")
    risk = request.args.get("risk")
    search = request.args.get("search")
    rule_type = request.args.get("type")

    rules = Rule.by_users()
    if search:
        rules = rules.filter(name__icontains=search)
    if active:
        rules = rules.filter(active=parse_str_bool(active))
    if rule_type:
        rules = rules.filter(type=rule_type)
    if risk:
        rules = rules.filter(
            risk__gte=RISK_LOOKUP[risk][0], risk__lte=RISK_LOOKUP[risk][1]
        )

    if page:
        rules_count = rules.count()
        pages = math.ceil(rules_count / MAX_PER_PAGE)
        rules = rules.skip((page - 1) * MAX_PER_PAGE)
        rules = rules.limit(MAX_PER_PAGE)

    result = to_dict(rules)
    if page:
        return jsonify({"rules": result, "size": rules_count, "pages": pages})

    return jsonify(result)


@api.route("/rules", methods=["POST"])
def create_rule():
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST
    rule = None

    data = request.get_json()
    rule_type = RuleType(data.get("type"))

    rule_attack_tactics = []
    rule_attack_techniques = []
    rule_attack = data.get("attack")

    if rule_attack and (rule_attack.get("tactics") or rule_attack.get("techniques")):
        attack_tactics = rule_attack.get("tactics")
        attack_techniques = rule_attack.get("techniques")
        if attack_tactics:
            rule_attack_tactics = list(
                filter(
                    lambda x: x is not None,
                    [attack.get_tactic(t) for t in attack_tactics],
                )
            )
        if attack_techniques:
            rule_attack_techniques = list(
                filter(
                    lambda x: x is not None,
                    [attack.get_technique(t) for t in attack_techniques],
                )
            )

    rule_attack = RuleATTACK(
        tactics=rule_attack_tactics, techniques=rule_attack_techniques
    )

    try:
        data.pop("attack")
        if rule_type is RuleType.SEARCH_QUERY:
            clean_attrs(base_attrs + threshold_attrs, data)
            rule = ThresholdRule(attack=rule_attack, **data)
        elif rule_type is RuleType.EQL_QUERY:
            clean_attrs(base_attrs + eql_attrs, data)
            rule = EQLRule(attack=rule_attack, **data)
        else:
            return response("Invalid rule type"), HTTPStatus.BAD_REQUEST

        rule.save()
        app.scheduler.load_rule(rule)

        return response("Rule created."), HTTPStatus.CREATED
    except:
        return response("An error occured."), HTTPStatus.BAD_REQUEST


@api.route("/rules/<rule_uuid>")
def get_rule_by_uuid(rule_uuid):
    rule = Rule.by_uuid(uuid=rule_uuid)
    if not rule:
        return response("Rule not found"), HTTPStatus.NOT_FOUND
    return jsonify(to_dict(rule))


@api.route("/rules/<rule_uuid>", methods=["PUT"])
def update_rule_by_uuid(rule_uuid):
    rule = Rule.by_uuid(uuid=rule_uuid)
    if not rule:
        return response("Rule not found"), HTTPStatus.NOT_FOUND

    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()

    rule_attack_tactics = []
    rule_attack_techniques = []
    rule_attack = data.get("attack")
    rule_type = RuleType(data.get("type"))

    if rule_type != rule.type:
        return response("Can't change the original rule type"), HTTPStatus.BAD_REQUEST

    if rule_attack and (rule_attack.get("tactics") or rule_attack.get("techniques")):
        attack_tactics = rule_attack.get("tactics")
        attack_techniques = rule_attack.get("techniques")
        if attack_tactics:
            rule_attack_tactics = list(
                filter(
                    lambda x: x is not None,
                    [attack.get_tactic(t) for t in attack_tactics],
                )
            )
        if attack_techniques:
            rule_attack_techniques = list(
                filter(
                    lambda x: x is not None,
                    [attack.get_technique(t) for t in attack_techniques],
                )
            )

    rule_attack = RuleATTACK(
        tactics=rule_attack_tactics, techniques=rule_attack_techniques
    )

    try:
        data.pop("attack")
        if rule_type is RuleType.SEARCH_QUERY:
            clean_attrs(allowed_attrs=base_attrs + threshold_attrs, data=data)
        elif rule_type is RuleType.EQL_QUERY:
            clean_attrs(allowed_attrs=base_attrs + eql_attrs, data=data)
        rule.update(attack=rule_attack, **data)
    except ValidationError as e:
        return response(e.message), HTTPStatus.BAD_REQUEST
    except:
        return response("Invalid parameters"), HTTPStatus.BAD_REQUEST

    return response("Rule updated.")


@api.route("/rules/<rule_uuid>/active", methods=["PUT"])
def update_rule_status_by_uuid(rule_uuid):
    rule = Rule.by_uuid(uuid=rule_uuid)
    if not rule:
        return response("Rule not found"), HTTPStatus.NOT_FOUND

    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()
    active_status = data.get("active", None)

    if not isinstance(active_status, bool):
        return response("Invalid status parameter type."), HTTPStatus.BAD_REQUEST

    try:
        rule.update(active=active_status)
    except:
        return response("Error on state update"), HTTPStatus.BAD_REQUEST

    if active_status:
        app.scheduler.load_rule(rule)
    else:
        app.scheduler.remove_job_by_id(rule_uuid)

    return response("Rule updated.")


@api.route("/rules/<rule_uuid>", methods=["DELETE"])
def remove_rule_by_uuid(rule_uuid):
    rule = Rule.by_uuid(uuid=rule_uuid)
    if not rule:
        return response("Rule not found"), HTTPStatus.NOT_FOUND
    try:
        rule.delete()
    except:
        return response("Error on rule deletion"), HTTPStatus.BAD_REQUEST
    return response("Rule removed.")


@api.route("/rules/<rule_uuid>/run", methods=["POST"])
def run_rule(rule_uuid):
    rule = Rule.by_uuid(uuid=rule_uuid)
    if not rule:
        return response("Rule not found"), HTTPStatus.NOT_FOUND

    # TODO - add run error handling
    try:
        rule.run(app.elastic, app.scheduler)
    except BadRequestError as e:
        return (
            response(repr(e.body["error"]["root_cause"][0]["reason"])),
            HTTPStatus.BAD_REQUEST,
        )
    except:
        return response("Error on rule execution"), HTTPStatus.BAD_REQUEST

    return response("Rule executed.")


@api.route("/rules/preview", methods=["POST"])
def preview_rule():
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST
    rule = None

    data = request.get_json()

    # General rule attribute check
    if not all(attr in data.keys() for attr in ["timeframe", "datasources", "type"]):
        return response("Missing rule preview paramaters"), HTTPStatus.BAD_REQUEST

    rule_type = data.get("type")
    trigger = RuleTrigger(type=RuleTriggerType.PERIODIC, value="0")

    # Specific rule type check
    if RuleType(rule_type) is RuleType.SEARCH_QUERY:
        if not all(
            attr in data.keys() for attr in ["group_by", "filters", "conditions"]
        ):
            return (
                response("Invalid Threshould rule paramaters"),
                HTTPStatus.BAD_REQUEST,
            )
        rule = ThresholdRule(
            name="preview",
            description="preview",
            risk=1,
            trigger=trigger,
            timeframe=data.get("timeframe"),
            datasources=data.get("datasources"),
            group_by=data.get("group_by"),
            filters=data.get("filters"),
            conditions=data.get("conditions"),
        )
    elif RuleType(rule_type) is RuleType.EQL_QUERY:
        if not all(attr in data.keys() for attr in ["query"]):
            return response("Invalid EQL rule paramaters"), HTTPStatus.BAD_REQUEST
        rule = EQLRule(
            name="preview",
            description="preview",
            risk=1,
            trigger=trigger,
            alert_type=AlertType.ALERT,
            timeframe=data.get("timeframe"),
            datasources=data.get("datasources"),
            query=data.get("query"),
        )
    else:
        return response("Invalid rule type"), HTTPStatus.BAD_REQUEST

    try:
        query_output, result = rule.run(app.elastic, None, preview=True)
        return jsonify({"result": result, "output": query_output})
    except Exception:
        # import traceback
        # print(traceback.format_exc())
        return response("Query error"), HTTPStatus.BAD_REQUEST


@api.route("/rules/eql-lookup", methods=["POST"])
def eql_lookup():
    if not request.is_json:
        return response("Invalid JSON!"), 400

    data = request.get_json()
    if not all(k for k in ["datasources", "query"] if k in data.keys()):
        return response("Missing parameters"), HTTPStatus.BAD_REQUEST

    datasources = Datasource.validate_datasources(data.get("datasources"))
    if not datasources:
        return response("No valid datasources were supplied."), HTTPStatus.BAD_REQUEST

    rule = EQLRule(
        name="preview",
        description="preview",
        risk=1,
        alert_type=AlertType.ALERT,
        trigger=RuleTrigger(type=RuleTriggerType.PERIODIC, value="0"),
        timeframe="always",
        datasources=datasources,
        query=data.get("query"),
    )

    prev_alerts = rule.run(app.elastic, None, lookup=True)

    if prev_alerts is None or len(prev_alerts) == 0:
        return jsonify([])

    prev_alerts_by_day = get_event_day_count(prev_alerts)
    return jsonify(prev_alerts_by_day)


@api.route("/rules/sigma", methods=["POST"])
def convert_from_sigma():
    if "rule" not in request.files:
        return response("Please upload an rule."), HTTPStatus.BAD_REQUEST

    rule_data = request.files["rule"].read()
    rule_info = extract_sigma_rule_data(rule_data)
    final_query = convert_sigma_to_eql_query(rule_data, rule_info["datasources"][0])

    rule = {"query": final_query}
    rule |= rule_info
    return jsonify(rule)


@api.route("/rules/external")
def get_external_rules():
    page = request.args.get("page", type=int, default=None)
    if page and page < 0:
        return response("Invalid page value"), HTTPStatus.BAD_REQUEST

    search = request.args.get("search")
    tactics = request.args.get("tactics")
    datasource = request.args.get("datasource")

    if tactics:
        tactics = tactics.split(", ")
    if datasource:
        datasource = datasource.split(", ")

    result = rule_feed.get_rules_summary(
        search=search, tactics=tactics, datasource=datasource
    )

    if page:
        return jsonify(
            {
                "rules": result[((page - 1) * MAX_PER_PAGE) : (page * MAX_PER_PAGE)],
                "size": len(result),
                "pages": math.ceil(len(result) / MAX_PER_PAGE),
            }
        )
    return jsonify(result)


@api.route("/rules/external/import", methods=["POST"])
def import_external_rules():
    success_count = 0
    error_count = 0
    skipped_count = 0

    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()
    ids = data.get("ids")
    if not (ids and isinstance(ids, list)):
        return response("Missing external rule ids"), HTTPStatus.NOT_FOUND

    ids = list(set(ids))
    trigger = RuleTrigger(type=RuleTriggerType.PERIODIC, value="10m")

    for uuid in ids:
        metadata = SigmaRuleMetadata.by_uuid(uuid=uuid)
        if not metadata:
            skipped_count += 1
            continue

        if EQLRule.by_uuid(uuid=metadata.uuid):
            skipped_count += 1
            continue

        tactics = [attack.get_tactic(t) for t in metadata.tactics]
        tactics = [t for t in tactics if t]
        techniques = [attack.get_technique(t) for t in metadata.techniques]
        techniques = [t for t in techniques if t]
        attack_entries = RuleATTACK(tactics=tactics, techniques=techniques)
        query = convert_sigma_to_eql_query(metadata.file, metadata.datasources[0])

        print(f"Importing external rule -> {metadata.uuid}")
        try:
            rule = EQLRule(
                uuid=metadata.uuid,
                name=metadata.name,
                description=metadata.description,
                datasources=metadata.datasources,
                risk=5,
                timeframe="10m",
                trigger=trigger,
                attack=attack_entries,
                query=query,
                origin=RuleOrigin.EXTERNAL,
                alert_type=AlertType.ALERT,
            )
            rule.save()
            success_count += 1
        except:
            error_count += 1

    return jsonify(
        {
            "message": "Import done.",
            "results": {
                "success": success_count,
                "skipped": skipped_count,
                "error": error_count,
            },
        }
    )
