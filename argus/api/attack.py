from http import HTTPStatus
from flask import request, jsonify

from api.routes import api
from api import response
from extensions import attack
from utils import parse_str_bool

ATTACK_MATRICES = ["enterprise", "ics"]


@api.route("/attack/tactics")
def get_attack_tactics():
    complete = parse_str_bool(request.args.get("complete"))
    include_rules = parse_str_bool(request.args.get("includeRules"))
    matrix = request.args.get("matrix", default="ics")

    if matrix not in ATTACK_MATRICES:
        return response("Invalid matrix"), HTTPStatus.NOT_FOUND

    tactics = attack.get_tactics(matrix, complete=complete, with_rules=include_rules)

    return jsonify({"tactics": tactics})


@api.route("/attack/techniques")
def get_attack_techniques_by_tactic():
    complete = parse_str_bool(request.args.get("complete"))
    include_rules = parse_str_bool(request.args.get("includeRules"))
    matrix = request.args.get("matrix", "ics")
    tactic = request.args.get("tactic")

    if matrix not in ATTACK_MATRICES:
        return response("Invalid matrix"), HTTPStatus.NOT_FOUND

    if tactic:
        techniques = attack.get_techniques_by_tactic(
            matrix=matrix,
            tactic=tactic,
            complete=complete,
            with_rules=include_rules,
        )
    else:
        techniques = attack.get_techniques(
            matrix=matrix, complete=complete, with_rules=include_rules
        )

    return jsonify({"techniques": techniques})


@api.route("/attack/datasources")
def get_attack_datasources():
    matrix = request.args.get("matrix", "ics")
    if matrix not in ATTACK_MATRICES:
        return response("Invalid matrix"), HTTPStatus.NOT_FOUND
    tactics = attack.get_data_sources(matrix)
    return jsonify({"datasources": tactics})


@api.route("/attack/groups")
def get_attack_groups():
    matrix = request.args.get("matrix", "ics")
    if matrix not in ATTACK_MATRICES:
        return response("Invalid matrix"), HTTPStatus.NOT_FOUND
    groups = attack.get_groups(matrix)
    return jsonify({"groups": groups})


@api.route("/attack/software")
def get_attack_software():
    matrix = request.args.get("matrix", "ics")
    if matrix not in ATTACK_MATRICES:
        return response("Invalid matrix"), HTTPStatus.NOT_FOUND
    software = attack.get_software(matrix)
    return jsonify({"software": software})
