from mongoengine import connect
from flask_apscheduler import APScheduler
from flask_security.datastore import MongoEngineUserDatastore
from elasticsearch.exceptions import ConnectionError, ConnectionTimeout
from github import Github, Auth

from scheduler import EngineScheduler
from clients import ATTACKClient, RuleFeedClient, ElasticClient
from baseline import Baseline
from settings import load_settings
from models.core import Role, User
from config import config

elastic = None
try:
    elastic = ElasticClient(config)
except ConnectionError:
    print("Can't connect to the elasticsearch instance. Check the configuration.")
except ConnectionTimeout:
    print("Elasticsearch is unreacheable.")
except Exception as e:
    print("Elasticsearch unknown error", e)

attack = ATTACKClient(config.ATTACK_MITRE_VERSION)

github = None
try:
    auth = Auth.Token(config.GITHUB_KEY)
    github = Github(auth=auth)
except:
    print("GITHUB API key is invalid.")

rule_feed = RuleFeedClient(github)

db = connect(**config.MONGO_SETTINGS)
user_datastore = MongoEngineUserDatastore(db, User, Role)

settings = load_settings()
baseline = Baseline(elastic, settings)

scheduler = APScheduler()
engine_scheduler = EngineScheduler(elastic, baseline, scheduler)
engine_scheduler.load_rules()
engine_scheduler.load_analytics()
