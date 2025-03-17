from flask.json import jsonify


def response(message):
    return jsonify({"message": message})
