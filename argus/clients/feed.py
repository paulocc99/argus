from typing import Optional
from github import Github, Auth
from github.GithubException import BadCredentialsException, UnknownObjectException

from models.management import SigmaRepository, SigmaRuleMetadata
from utils import to_dict
from utils.extractor import extract_sigma_rule_data


class RuleFeedClient:
    def __init__(self, github: Github):
        self.github = github

    def _get_github_repo(self, repo: str):
        try:
            repository = self.github.get_repo(repo)
            return repository
        except BadCredentialsException:
            print("Invalid Github token credential.")
        except UnknownObjectException:
            print("Repository not found.")
        except Exception:
            print("Error on Github")

    def _get_rules(self):
        sigma_repos = SigmaRepository.objects.all()
        for rule_repo in sigma_repos:
            repo = self.github.get_repo(rule_repo.repository)
            for mapping in rule_repo.mappings:
                contents = repo.get_contents(mapping.path)
                while contents:
                    file_content = contents.pop(0)
                    if file_content.type == "dir":
                        contents.extend(repo.get_contents(file_content.path))
                    else:
                        rr = SigmaRuleMetadata.objects(
                            original_name=file_content.path
                        ).first()
                        if rr:
                            continue
                        rule_info = extract_sigma_rule_data(
                            file_content.decoded_content
                        )
                        rule = SigmaRuleMetadata(
                            uuid=rule_info["id"],
                            original_name=file_content.name,
                            description=rule_info["description"],
                            date=rule_info["date"],
                            name=rule_info["name"],
                            author=rule_info["author"],
                            severity=rule_info["severity"],
                            datasources=rule_info["datasources"],
                            tactics=rule_info["attack"]["tatics"],
                            techniques=rule_info["attack"]["techniques"],
                            file=file_content.decoded_content,
                            repository=rule_repo,
                        )
                        rule.save()

    def get_rules_summary(
        self,
        search: Optional[str] = None,
        tactics: Optional[list[str]] = None,
        datasource: Optional[list[str]] = None,
    ) -> list:
        filtered_rules = []
        rules = (
            SigmaRuleMetadata.objects.all()
            .exclude("id", "file", "repository")
            .order_by("-date")
        )

        if rules.count() == 0:
            self._get_rules()

        for rule in rules:
            if search:
                if search not in rule.name:
                    continue
            if datasource:
                if not any(d for d in datasource if d in rule.datasources):
                    continue
            if tactics:
                if not any(t for t in tactics if t in rule.tactics):
                    continue
            filtered_rules.append(to_dict(rule))
        return filtered_rules

    def get_rule_by_id(self, id: str):
        return next(filter(lambda r: r["uuid"] == id, rules), None)

    def _create_rule(self, file, repo: SigmaRepository):
        found = SigmaRuleMetadata.objects(
            original_name=file.name, repository=repo
        ).first()
        if found:
            return

        rule_info = extract_sigma_rule_data(file.decoded_content)
        try:
            rule = SigmaRuleMetadata(
                uuid=rule_info["id"],
                original_name=file.name,
                name=rule_info["name"],
                description=rule_info["description"],
                author=rule_info["author"],
                date=rule_info["date"],
                severity=rule_info["severity"],
                datasources=rule_info["datasources"],
                tactics=rule_info["attack"]["tactics"],
                techniques=rule_info["attack"]["techniques"],
                file=file.decoded_content,
                repository=repo,
            )
            rule.save()
        except:
            print(f"Error while importing external sigma rule: {rule_info['name']}")

    def process_repository_rules(self, sigma_repo: SigmaRepository) -> None:
        repo = self._get_github_repo(sigma_repo.repository)
        if not repo:
            return
        for mapping in sigma_repo.mappings:
            contents = repo.get_contents(mapping.path)
            while contents:
                file_content = contents.pop(0)
                if file_content.type == "dir":
                    contents.extend(repo.get_contents(file_content.path))
                else:
                    self._create_rule(file_content, sigma_repo)
