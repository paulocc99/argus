from flask import Flask
from mongoengine.errors import NotUniqueError
from pathlib import Path
import requests
import os
import utils
import yaml

from config import Config
from models.core import Datasource
from models.baseline import BaselineAnalytic


def setup_attack_knowledge_base(version: str) -> None:
    matrices = ["enterprise-attack", "ics-attack"]
    base_repo_path = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/refs/heads/master"
    data_dir = utils.get_config_path()
    try:
        valid_version = float(version)
        for matrix in matrices:
            matrix_file_path = os.path.join(data_dir, f"{matrix}-{valid_version}.json")
            matrix_file = Path(matrix_file_path)

            if matrix_file.is_file():
                continue

            r = requests.get(f"{base_repo_path}/{matrix}/{matrix}-{valid_version}.json")
            if r.status_code != 200:
                return

            with open(matrix_file_path, "wb") as f:
                f.write(r.content)
            print(f"{matrix}-{valid_version}.json file created.")
    except ValueError:
        print("Invalid MITRE ATTACK Version. Couldn't retrieve the STIX files.")
    except Exception as e:
        print(e)


def setup_native_analytics():
    if BaselineAnalytic.objects.count() > 0:
        return

    analytics_dir = utils.get_analytics_path()
    for root, folders, files in os.walk(analytics_dir):
        for file_name in files:
            try:
                file_path = os.path.join(root, file_name)
                file_contents = open(file_path, "r").read()
                file_data = yaml.safe_load(file_contents)
                analytic = BaselineAnalytic.from_dict(file_data)
                if not analytic:
                    continue
                print("Adding a new baseline: ", analytic.code)
                analytic.save()
            except NotUniqueError:
                print("An analytic with this code already exists.")
            except Exception as e:
                print("[INITIALIZE] Analytic creation error")
                print(type(e))


def setup_default_datasources():
    if Datasource.objects.count() > 0:
        return
    try:
        baseline_ds = Datasource(name="baseline", indices=["baseline"], lock=True)
        baseline_ds.save()
    except:
        pass


def enable_setup_routes(app: Flask):
    from api.setup import setup_api

    app.register_blueprint(setup_api, url_prefix="/api")


def setup(app: Flask, config: Config) -> None:
    print("Initializating app ...")
    enable_setup_routes(app)
    setup_native_analytics()
    setup_default_datasources()
    setup_attack_knowledge_base(config.ATTACK_MITRE_VERSION)
