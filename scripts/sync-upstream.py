#!/usr/bin/env python3
"""
sync-upstream.py — rebuild the imported parts of agent-forge from the five upstream repos.

Usage:
  python3 scripts/sync-upstream.py --sources /path/to/clones --target /path/to/agent-forge

Expected clone layout under --sources:
  spec-kit/  ECC/  agency-agents/  mattpocock-skills/  addyosmani-skills/

Only *imported* directories are regenerated (agents/, roster/, skills/ (non-curated),
rules/, templates/, playbooks/, contexts/). Hand-written files (commands/, hooks/,
docs/, README.md, CLAUDE.md, the orchestrator agent, forge-guide skill, merged
reference sections) are never touched unless they live inside a regenerated
directory and are listed in CURATED below.
"""
import argparse, json, os, re, shutil, sys
from pathlib import Path

# --------------------------------------------------------------------------
# Manifest
# --------------------------------------------------------------------------

ADDY_RENAMES = {
    "test-driven-development": "tdd",
    "code-review-and-quality": "code-review",
    "debugging-and-error-recovery": "debugging",
    "git-workflow-and-versioning": "git-workflow",
    "api-and-interface-design": "api-design",
    "security-and-hardening": "security",
    "planning-and-task-breakdown": "planning",
    "using-agent-skills": "forge-guide",
}
ADDY_SHARED_REFS = [
    "accessibility-checklist", "definition-of-done", "observability-checklist",
    "orchestration-patterns", "performance-checklist", "security-checklist", "testing-patterns",
]

# skills: (source_repo, source_rel_dir, category, target_name)
SKILLS = [
    # ---- workflow (lifecycle) ----
    ("addy", "skills/interview-me", "workflow", "interview-me"),
    ("addy", "skills/idea-refine", "workflow", "idea-refine"),
    ("matt", "skills/productivity/grilling", "workflow", "grilling"),
    ("matt", "skills/productivity/grill-me", "workflow", "grill-me"),
    ("matt", "skills/engineering/grill-with-docs", "workflow", "grill-with-docs"),
    ("addy", "skills/spec-driven-development", "workflow", "spec-driven-development"),
    ("addy", "skills/constraint-driven-development", "workflow", "constraint-driven-development"),
    ("addy", "skills/planning-and-task-breakdown", "workflow", "planning"),
    ("addy", "skills/incremental-implementation", "workflow", "incremental-implementation"),
    ("matt", "skills/engineering/implement", "workflow", "implement"),
    ("matt", "skills/engineering/implement-spec", "workflow", "implement-spec"),
    ("addy", "skills/test-driven-development", "workflow", "tdd"),
    ("addy", "skills/code-review-and-quality", "workflow", "code-review"),
    ("addy", "skills/code-simplification", "workflow", "code-simplification"),
    ("addy", "skills/debugging-and-error-recovery", "workflow", "debugging"),
    ("ecc", "skills/verification-loop", "workflow", "verification-loop"),
    ("addy", "skills/shipping-and-launch", "workflow", "shipping-and-launch"),
    ("addy", "skills/git-workflow-and-versioning", "workflow", "git-workflow"),
    ("matt", "skills/engineering/pr", "workflow", "pr"),
    ("ecc", "skills/conventional-commit-review", "workflow", "conventional-commit-review"),
    ("matt", "skills/productivity/handoff", "workflow", "handoff"),
    ("matt", "skills/engineering/retro", "workflow", "retro"),
    ("matt", "skills/engineering/research", "workflow", "research"),
    ("matt", "skills/engineering/prototype", "workflow", "prototype"),
    ("matt", "skills/engineering/wizard", "workflow", "wizard"),
    ("matt", "skills/productivity/teach", "workflow", "teach"),
    ("matt", "skills/productivity/to-questionnaire", "workflow", "to-questionnaire"),
    ("matt", "skills/productivity/wait-what", "workflow", "wait-what"),
    ("matt", "skills/engineering/to-spec", "workflow", "to-spec"),
    ("matt", "skills/engineering/to-tickets", "workflow", "to-tickets"),
    ("matt", "skills/engineering/triage", "workflow", "triage"),
    ("matt", "skills/engineering/wayfinder", "workflow", "wayfinder"),
    ("matt", "skills/engineering/setup-matt-pocock-skills", "workflow", "forge-setup"),
    ("matt", "skills/engineering/domain-modeling", "workflow", "domain-modeling"),
    ("matt", "skills/engineering/codebase-design", "workflow", "codebase-design"),
    ("matt", "skills/engineering/improve-codebase-architecture", "workflow", "improve-codebase-architecture"),
    ("addy", "skills/documentation-and-adrs", "workflow", "documentation-and-adrs"),
    ("addy", "skills/doubt-driven-development", "workflow", "doubt-driven-development"),
    ("ecc", "skills/council", "workflow", "council"),
    ("addy", "skills/context-engineering", "workflow", "context-engineering"),
    ("ecc", "skills/strategic-compact", "workflow", "strategic-compact"),
    ("ecc", "skills/context-budget", "workflow", "context-budget"),
    ("addy", "skills/source-driven-development", "workflow", "source-driven-development"),
    ("ecc", "skills/documentation-lookup", "workflow", "documentation-lookup"),
    ("ecc", "skills/deep-research", "workflow", "deep-research"),
    ("ecc", "skills/search-first", "workflow", "search-first"),
    ("ecc", "skills/intent-driven-development", "workflow", "intent-driven-development"),
    ("ecc", "skills/change-impact", "workflow", "change-impact"),
    ("ecc", "skills/codebase-onboarding", "workflow", "codebase-onboarding"),
    ("ecc", "skills/production-audit", "workflow", "production-audit"),
    ("ecc", "skills/issue-review", "workflow", "issue-review"),
    ("matt", "skills/productivity/writing-for-agents", "workflow", "writing-for-agents"),
    # ---- engineering ----
    ("addy", "skills/api-and-interface-design", "engineering", "api-design"),
    ("ecc", "skills/contract-first", "engineering", "contract-first"),
    ("ecc", "skills/hexagonal-architecture", "engineering", "hexagonal-architecture"),
    ("ecc", "skills/backend-patterns", "engineering", "backend-patterns"),
    ("addy", "skills/frontend-ui-engineering", "engineering", "frontend-ui-engineering"),
    ("ecc", "skills/frontend-patterns", "engineering", "frontend-patterns"),
    ("ecc", "skills/frontend-design-direction", "engineering", "frontend-design-direction"),
    ("ecc", "skills/design-system", "engineering", "design-system"),
    ("ecc", "skills/accessibility", "engineering", "accessibility"),
    ("addy", "skills/security-and-hardening", "engineering", "security"),
    ("addy", "skills/performance-optimization", "engineering", "performance-optimization"),
    ("addy", "skills/observability-and-instrumentation", "engineering", "observability-and-instrumentation"),
    ("ecc", "skills/error-handling", "engineering", "error-handling"),
    ("ecc", "skills/database-migrations", "engineering", "database-migrations"),
    ("ecc", "skills/postgres-patterns", "engineering", "postgres-patterns"),
    ("ecc", "skills/mysql-patterns", "engineering", "mysql-patterns"),
    ("ecc", "skills/redis-patterns", "engineering", "redis-patterns"),
    ("ecc", "skills/prisma-patterns", "engineering", "prisma-patterns"),
    ("ecc", "skills/deployment-patterns", "engineering", "deployment-patterns"),
    ("ecc", "skills/docker-patterns", "engineering", "docker-patterns"),
    ("ecc", "skills/kubernetes-patterns", "engineering", "kubernetes-patterns"),
    ("addy", "skills/ci-cd-and-automation", "engineering", "ci-cd-and-automation"),
    ("ecc", "skills/github-ops", "engineering", "github-ops"),
    ("ecc", "skills/e2e-testing", "engineering", "e2e-testing"),
    ("ecc", "skills/browser-qa", "engineering", "browser-qa"),
    ("addy", "skills/browser-testing-with-devtools", "engineering", "browser-testing-with-devtools"),
    ("addy", "skills/deprecation-and-migration", "engineering", "deprecation-and-migration"),
    ("ecc", "skills/mcp-server-patterns", "engineering", "mcp-server-patterns"),
    ("ecc", "skills/seo", "engineering", "seo"),
    # ---- languages ----
    ("ecc", "skills/coding-standards", "languages", "coding-standards"),
    ("ecc", "skills/typescript-patterns", "languages", "typescript-patterns"),
    ("ecc", "skills/react-patterns", "languages", "react-patterns"),
    ("ecc", "skills/react-testing", "languages", "react-testing"),
    ("ecc", "skills/nextjs-turbopack", "languages", "nextjs-turbopack"),
    ("ecc", "skills/vue-patterns", "languages", "vue-patterns"),
    ("ecc", "skills/nuxt4-patterns", "languages", "nuxt4-patterns"),
    ("ecc", "skills/nestjs-patterns", "languages", "nestjs-patterns"),
    ("ecc", "skills/react-native-patterns", "languages", "react-native-patterns"),
    ("ecc", "skills/python-patterns", "languages", "python-patterns"),
    ("ecc", "skills/python-testing", "languages", "python-testing"),
    ("ecc", "skills/fastapi-patterns", "languages", "fastapi-patterns"),
    ("ecc", "skills/django-patterns", "languages", "django-patterns"),
    ("ecc", "skills/golang-patterns", "languages", "golang-patterns"),
    ("ecc", "skills/golang-testing", "languages", "golang-testing"),
    ("ecc", "skills/rust-patterns", "languages", "rust-patterns"),
    ("ecc", "skills/rust-testing", "languages", "rust-testing"),
    ("ecc", "skills/java-coding-standards", "languages", "java-coding-standards"),
    ("ecc", "skills/springboot-patterns", "languages", "springboot-patterns"),
    ("ecc", "skills/kotlin-patterns", "languages", "kotlin-patterns"),
    ("ecc", "skills/swiftui-patterns", "languages", "swiftui-patterns"),
    ("ecc", "skills/dart-flutter-patterns", "languages", "dart-flutter-patterns"),
    ("ecc", "skills/laravel-patterns", "languages", "laravel-patterns"),
    ("ecc", "skills/rails-patterns", "languages", "rails-patterns"),
    ("ecc", "skills/dotnet-patterns", "languages", "dotnet-patterns"),
    # ---- agentic ----
    ("ecc", "skills/autonomous-loops", "agentic", "autonomous-loops"),
    ("ecc", "skills/eval-harness", "agentic", "eval-harness"),
    ("ecc", "skills/agent-harness-construction", "agentic", "agent-harness-construction"),
    ("ecc", "skills/prompt-optimizer", "agentic", "prompt-optimizer"),
    ("ecc", "skills/prompt-caching-strategy", "agentic", "prompt-caching-strategy"),
    ("ecc", "skills/parallel-execution-optimizer", "agentic", "parallel-execution-optimizer"),
    ("ecc", "skills/team-builder", "agentic", "team-builder"),
    ("ecc", "skills/dev-team", "agentic", "dev-team"),
    ("ecc", "skills/agent-security-hardening", "agentic", "agent-security-hardening"),
    ("ecc", "skills/safety-guard", "agentic", "safety-guard"),
    ("ecc", "skills/skill-scout", "agentic", "skill-scout"),
    ("ecc", "skills/skill-stocktake", "agentic", "skill-stocktake"),
    ("ecc", "skills/rules-distill", "agentic", "rules-distill"),
    # ---- product / growth ----
    ("ecc", "skills/market-research", "product", "market-research"),
    ("ecc", "skills/brand-voice", "product", "brand-voice"),
    ("ecc", "skills/content-engine", "product", "content-engine"),
    ("ecc", "skills/article-writing", "product", "article-writing"),
    ("ecc", "skills/marketing-campaign", "product", "marketing-campaign"),
    ("ecc", "skills/investor-materials", "product", "investor-materials"),
    # ---- ml ----
    ("ecc", "skills/mle-workflow", "ml", "mle-workflow"),
    ("ecc", "skills/pytorch-patterns", "ml", "pytorch-patterns"),
    ("ecc", "skills/ml-adoption-playbook", "ml", "ml-adoption-playbook"),
]

# Reference files merged into a primary skill: (target skill path, source repo, source file, dest name, one-line label)
MERGED_REFS = [
    ("workflow/tdd", "matt", "skills/engineering/tdd/SKILL.md", "seams-and-anti-patterns.md", "Seams, tracer bullets, test anti-patterns, rules of the loop (Matt Pocock)"),
    ("workflow/tdd", "matt", "skills/engineering/tdd/tests.md", "good-tests.md", "What a good test looks like, with examples (Matt Pocock)"),
    ("workflow/tdd", "matt", "skills/engineering/tdd/mocking.md", "mocking.md", "Mocking guidelines (Matt Pocock)"),
    ("workflow/tdd", "ecc", "skills/tdd-workflow/SKILL.md", "tdd-workflow-ecc.md", "Full TDD workflow with plan handoff, coverage targets and evidence report (ECC)"),
    ("workflow/code-review", "matt", "skills/engineering/code-review/SKILL.md", "standards-and-spec-axes.md", "Review against documented standards and the original spec since a fixed git point (Matt Pocock)"),
    ("workflow/debugging", "matt", "skills/engineering/diagnosing-bugs/SKILL.md", "diagnosis-loop.md", "Hypothesis-driven diagnosis loop for hard bugs and perf regressions (Matt Pocock)"),
    ("workflow/git-workflow", "ecc", "skills/git-workflow/SKILL.md", "git-patterns-ecc.md", "Branching strategies, history tidying, rebase and recovery recipes (ECC)"),
    ("engineering/api-design", "ecc", "skills/api-design/SKILL.md", "rest-api-patterns.md", "REST specifics: naming, status codes, pagination, errors, versioning, rate limits (ECC)"),
    ("engineering/security", "ecc", "skills/security-review/SKILL.md", "security-review-ecc.md", "Language-by-language security review checklist and remediation patterns (ECC)"),
    ("workflow/documentation-and-adrs", "ecc", "skills/architecture-decision-records/SKILL.md", "adr-ecc.md", "Numbered ADR files in docs/adr with index maintenance (ECC)"),
    ("workflow/documentation-and-adrs", "matt", "skills/engineering/domain-modeling/ADR-FORMAT.md", "adr-format-matt.md", "Compact ADR format (Matt Pocock)"),
    ("engineering/accessibility", "ecc", "skills/frontend-a11y/SKILL.md", "frontend-a11y-react.md", "React/Next.js accessibility patterns: ARIA, forms, focus, keyboard (ECC)"),
]
# Extra dirs copied alongside a merged skill
MERGED_DIRS = [
    ("workflow/debugging", "matt", "skills/engineering/diagnosing-bugs/scripts", "scripts"),
]

# ECC agents -> core
ECC_CORE_AGENTS = [
    "planner", "architect", "code-architect", "code-explorer", "code-reviewer", "code-simplifier",
    "comment-analyzer", "commit-reviewer", "build-error-resolver", "database-reviewer", "doc-updater",
    "docs-lookup", "e2e-runner", "performance-optimizer", "pr-test-analyzer", "refactor-cleaner",
    "security-reviewer", "silent-failure-hunter", "spec-miner", "tdd-guide", "type-design-analyzer",
    "agent-evaluator", "loop-operator",
]
ADDY_CORE_AGENTS = ["test-engineer", "web-performance-auditor"]
# agency -> core: (division/file, slug)
AGENCY_CORE_AGENTS = [
    ("testing/testing-reality-checker.md", "reality-checker"),
    ("testing/testing-evidence-collector.md", "evidence-collector"),
]

# roster: division -> list of (repo, rel path, slug)
ROSTER = {
    "languages": [("ecc", f"agents/{n}.md", n) for n in [
        "typescript-reviewer", "react-reviewer", "react-build-resolver", "vue-reviewer",
        "python-reviewer", "django-reviewer", "django-build-resolver", "fastapi-reviewer",
        "go-reviewer", "go-build-resolver", "rust-reviewer", "rust-build-resolver",
        "java-reviewer", "java-build-resolver", "kotlin-reviewer", "kotlin-build-resolver",
        "swift-reviewer", "swift-build-resolver", "flutter-reviewer", "dart-build-resolver",
        "php-reviewer", "ruby-reviewer", "csharp-reviewer", "fsharp-reviewer",
        "cpp-reviewer", "cpp-build-resolver"]],
    "engineering": [("agency", f"engineering/engineering-{n}.md", n) for n in [
        "frontend-developer", "backend-architect", "mobile-app-builder", "devops-automator",
        "rapid-prototyper", "software-architect", "sre", "technical-writer", "git-workflow-master",
        "database-optimizer", "database-reliability-engineer", "api-platform-engineer",
        "platform-engineer", "data-engineer", "data-visualization-engineer", "prompt-engineer",
        "minimal-change-engineer", "codebase-onboarding-engineer", "incident-response-commander",
        "developer-tooling-engineer", "desktop-app-engineer", "i18n-engineer",
        "identity-access-engineer", "payments-billing-engineer", "privacy-engineer",
        "realtime-collaboration-engineer", "search-relevance-engineer",
        "multi-agent-systems-architect", "finops-engineer", "mobile-release-engineer",
        "solidity-smart-contract-engineer"]],
    "ml": [("ecc", "agents/mle-reviewer.md", "mle-reviewer"),
            ("ecc", "agents/rag-pipeline-reviewer.md", "rag-pipeline-reviewer"),
            ("ecc", "agents/pytorch-build-resolver.md", "pytorch-build-resolver"),
            ("agency", "engineering/engineering-ai-engineer.md", "ai-engineer"),
            ("agency", "engineering/engineering-rag-pipeline-engineer.md", "rag-pipeline-engineer"),
            ("agency", "engineering/engineering-llm-post-training-engineer.md", "llm-post-training-engineer")],
    "testing": [("agency", f"testing/testing-{n}.md", n) for n in [
        "accessibility-auditor", "api-tester", "performance-benchmarker",
        "test-automation-engineer", "test-results-analyzer"]],
    "product": [("agency", "product/product-manager.md", "product-manager"),
                ("agency", "product/product-sprint-prioritizer.md", "sprint-prioritizer"),
                ("agency", "product/product-feedback-synthesizer.md", "feedback-synthesizer"),
                ("agency", "product/product-trend-researcher.md", "trend-researcher"),
                ("agency", "product/product-dx-engineer.md", "dx-engineer")],
    "design": [("agency", f"design/design-{n}.md", n) for n in [
        "ui-designer", "ux-architect", "ux-researcher", "brand-guardian",
        "ui-finish-gate-reviewer", "whimsy-injector", "persona-walkthrough"]]
        + [("ecc", "agents/a11y-architect.md", "a11y-architect")],
    "project-management": [
        ("agency", "project-management/project-management-project-shepherd.md", "project-shepherd"),
        ("agency", "project-management/project-manager-senior.md", "project-manager-senior"),
        ("agency", "project-management/project-management-meeting-notes-specialist.md", "meeting-notes-specialist"),
        ("agency", "project-management/project-management-experiment-tracker.md", "experiment-tracker"),
        ("agency", "project-management/project-management-jira-workflow-steward.md", "jira-workflow-steward")],
    "security": [("agency", "security/security-appsec-engineer.md", "appsec-engineer"),
                 ("agency", "security/security-architect.md", "security-architect"),
                 ("agency", "security/security-secrets-credential-engineer.md", "secrets-credential-engineer"),
                 ("agency", "security/security-ai-generated-code-auditor.md", "ai-generated-code-auditor"),
                 ("agency", "security/security-compliance-auditor.md", "compliance-auditor"),
                 ("agency", "security/security-cloud-security-architect.md", "cloud-security-architect"),
                 ("agency", "security/security-blockchain-security-auditor.md", "blockchain-security-auditor"),
                 ("agency", "security/security-penetration-tester.md", "penetration-tester")],
    "specialized": [("agency", "specialized/specialized-mcp-builder.md", "mcp-builder"),
                    ("agency", "specialized/specialized-master-plan-architect.md", "master-plan-architect"),
                    ("agency", "specialized/specialized-workflow-architect.md", "workflow-architect"),
                    ("agency", "specialized/specialized-developer-advocate.md", "developer-advocate"),
                    ("agency", "specialized/specialized-codebase-archaeologist.md", "codebase-archaeologist"),
                    ("agency", "specialized/specialized-document-generator.md", "document-generator"),
                    ("agency", "support/support-executive-summary-generator.md", "executive-summary-generator"),
                    ("agency", "support/support-analytics-reporter.md", "analytics-reporter")],
    "growth": [("agency", "marketing/marketing-growth-hacker.md", "growth-hacker"),
               ("agency", "marketing/marketing-content-creator.md", "content-creator"),
               ("agency", "marketing/marketing-developer-community-builder.md", "developer-community-builder"),
               ("agency", "marketing/marketing-social-media-strategist.md", "social-media-strategist"),
               ("ecc", "agents/marketing-agent.md", "marketing-agent"),
               ("ecc", "agents/seo-specialist.md", "seo-specialist")],
}

TEMPLATES = [
    ("speckit", "templates/constitution-template.md", "constitution-template.md"),
    ("speckit", "templates/spec-template.md", "spec-template.md"),
    ("speckit", "templates/plan-template.md", "plan-template.md"),
    ("speckit", "templates/tasks-template.md", "tasks-template.md"),
    ("speckit", "templates/checklist-template.md", "checklist-template.md"),
    ("matt", "skills/engineering/domain-modeling/ADR-FORMAT.md", "adr-template.md"),
    ("matt", "skills/engineering/domain-modeling/GLOSSARY-FORMAT.md", "glossary-template.md"),
]

PLAYBOOKS = [  # (repo, src, dest) — dirs or files
    ("agency", "strategy/playbooks", "nexus/playbooks"),
    ("agency", "strategy/runbooks", "nexus/runbooks"),
    ("agency", "strategy/runbooks.json", "nexus/runbooks.json"),
    ("agency", "strategy/coordination", "nexus/coordination"),
    ("agency", "strategy/nexus-strategy.md", "nexus/nexus-strategy.md"),
    ("agency", "strategy/QUICKSTART.md", "nexus/QUICKSTART.md"),
    ("addy", "references", "checklists"),
    ("speckit", "spec-driven.md", "spec-driven-development.md"),
    ("ecc", "contexts", "../contexts"),
]

REPO_DIRS = {"speckit": "spec-kit", "ecc": "ECC", "agency": "agency-agents",
             "matt": "mattpocock-skills", "addy": "addyosmani-skills"}
ORIGIN_LABEL = {"speckit": "github/spec-kit", "ecc": "affaan-m/ECC", "agency": "msitarzewski/agency-agents",
                "matt": "mattpocock/skills", "addy": "addyosmani/agent-skills"}

# --------------------------------------------------------------------------
# Transforms
# --------------------------------------------------------------------------

PROMPT_DEFENSE_RE = re.compile(r"## Prompt Defense Baseline\n\n(?:- .*\n)+\n?", re.M)

def t_ecc(s: str) -> str:
    s = PROMPT_DEFENSE_RE.sub("", s)
    s = re.sub(r"\becc@ecc\b", "forge", s)
    s = re.sub(r"(?<![\w/])ecc:(?=[a-z])", "forge:", s)
    s = s.replace("/ecc-guide", "/forge:guide").replace("`ecc-guide`", "`forge:guide`")
    s = s.replace("/ecc:", "/forge:")
    return s

def t_addy(s: str) -> str:
    for old, new in ADDY_RENAMES.items():
        s = s.replace(f"agent-skills:{old}", f"forge:{new}")
        s = re.sub(rf"(?<![\w-]){re.escape(old)}(?![\w-])", new, s)
    s = s.replace("agent-skills:review", "forge:review")
    s = re.sub(r"agent-skills:([a-z-]+)", r"forge:\1", s)
    for ref in ADDY_SHARED_REFS:
        s = re.sub(rf"(?<![\w/])references/{ref}\.md", f"playbooks/checklists/{ref}.md", s)
    s = s.replace("`references/` directory", "`playbooks/checklists/` directory")
    return s

def t_matt(s: str) -> str:
    s = s.replace("setup-matt-pocock-skills", "forge-setup")
    s = s.replace("Setup Matt Pocock's Skills", "Forge Setup")
    s = s.replace("Matt Pocock's skills", "the Forge engineering skills")
    return s

def t_agency(s: str, slug: str) -> str:
    # normalise frontmatter name to the kebab-case slug used as subagent_type
    s = re.sub(r"^name:.*$", f"name: {slug}", s, count=1, flags=re.M)
    return s

TRANSFORMS = {"ecc": t_ecc, "addy": t_addy, "matt": t_matt, "speckit": lambda s: s, "agency": lambda s: s}

def add_origin(s: str, repo: str, kind: str) -> str:
    """Add metadata.origin to frontmatter when absent (skills) or an HTML provenance comment (agents)."""
    label = ORIGIN_LABEL[repo]
    if not s.startswith("---"):
        return f"<!-- origin: {label} -->\n" + s
    end = s.find("\n---", 3)
    if end == -1:
        return s
    fm, body = s[:end], s[end:]
    if kind == "skill":
        if "origin:" in fm:
            fm = re.sub(r"origin:\s*ECC", f"origin: {label}", fm)
        elif "metadata:" in fm:
            fm = fm.replace("metadata:", f"metadata:\n  origin: {label}", 1)
        else:
            fm = fm + f"\nmetadata:\n  origin: {label}"
        return fm + body
    # agents: keep frontmatter untouched, add a comment after it
    rest = body[4:]
    return fm + "\n---\n" + f"<!-- origin: {label} -->" + rest

def set_frontmatter_name(s: str, name: str) -> str:
    return re.sub(r"^name:.*$", f"name: {name}", s, count=1, flags=re.M)

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")

def write(p: Path, s: str):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s, encoding="utf-8")

def copy_tree(src: Path, dst: Path, fn, kind=None, repo=None):
    if dst.exists():
        shutil.rmtree(dst)
    for root, _dirs, files in os.walk(src):
        for f in files:
            sp = Path(root) / f
            rel = sp.relative_to(src)
            dp = dst / rel
            if sp.suffix in (".md", ".yaml", ".yml", ".json", ".txt", ".sh", ".toml"):
                s = fn(read(sp))
                if f == "SKILL.md" and kind == "skill":
                    s = add_origin(s, repo, "skill")
                write(dp, s)
            else:
                dp.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(sp, dp)

def strip_frontmatter(s: str) -> str:
    if s.startswith("---"):
        end = s.find("\n---", 3)
        if end != -1:
            return s[end + 4:].lstrip("\n")
    return s

# --------------------------------------------------------------------------
# Build
# --------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sources", required=True)
    ap.add_argument("--target", required=True)
    args = ap.parse_args()
    SRC = Path(args.sources)
    T = Path(args.target)
    report = {"skills": [], "agents": [], "roster": {}, "templates": [], "playbooks": []}

    def src(repo, rel):
        return SRC / REPO_DIRS[repo] / rel

    # ---- skills ----
    for repo, rel, cat, name in SKILLS:
        sdir = src(repo, rel)
        if not sdir.exists():
            print(f"!! missing skill source {sdir}", file=sys.stderr); continue
        ddir = T / "skills" / cat / name
        copy_tree(sdir, ddir, TRANSFORMS[repo], kind="skill", repo=repo)
        sk = ddir / "SKILL.md"
        s = read(sk)
        s = set_frontmatter_name(s, name)
        write(sk, s)
        report["skills"].append(f"{cat}/{name} <- {ORIGIN_LABEL[repo]}:{rel}")

    # ---- merged references ----
    merged_notes = {}
    for skill, repo, rel, dest, label in MERGED_REFS:
        sp = src(repo, rel)
        if not sp.exists():
            print(f"!! missing ref source {sp}", file=sys.stderr); continue
        body = TRANSFORMS[repo](read(sp))
        body = strip_frontmatter(body)
        header = f"<!-- Reference imported from {ORIGIN_LABEL[repo]} ({rel}). Read on demand; the primary guidance is in ../SKILL.md -->\n\n"
        write(T / "skills" / skill / "references" / dest, header + body)
        merged_notes.setdefault(skill, []).append((dest, label))
    for skill, repo, rel, dest in MERGED_DIRS:
        sp = src(repo, rel)
        if sp.exists():
            copy_tree(sp, T / "skills" / skill / dest, TRANSFORMS[repo])
    for skill, items in merged_notes.items():
        sk = T / "skills" / skill / "SKILL.md"
        s = read(sk)
        if "## Deeper references" not in s:
            s = s.rstrip("\n") + "\n\n## Deeper references\n\nRead these only when the task needs them (progressive disclosure):\n\n"
            for dest, label in items:
                s += f"- `references/{dest}` — {label}\n"
            write(sk, s)

    # ---- core agents ----
    agents_dir = T / "agents"
    agents_dir.mkdir(parents=True, exist_ok=True)
    for n in ECC_CORE_AGENTS:
        s = add_origin(t_ecc(read(src("ecc", f"agents/{n}.md"))), "ecc", "agent")
        write(agents_dir / f"{n}.md", s); report["agents"].append(f"{n} <- ECC")
    for n in ADDY_CORE_AGENTS:
        s = add_origin(t_addy(read(src("addy", f"agents/{n}.md"))), "addy", "agent")
        write(agents_dir / f"{n}.md", s); report["agents"].append(f"{n} <- addyosmani")
    for rel, slug in AGENCY_CORE_AGENTS:
        s = add_origin(t_agency(read(src("agency", rel)), slug), "agency", "agent")
        write(agents_dir / f"{slug}.md", s); report["agents"].append(f"{slug} <- agency")

    # ---- roster ----
    roster_dir = T / "roster"
    if roster_dir.exists():
        shutil.rmtree(roster_dir)
    for division, items in ROSTER.items():
        for repo, rel, slug in items:
            sp = src(repo, rel)
            if not sp.exists():
                print(f"!! missing roster source {sp}", file=sys.stderr); continue
            s = read(sp)
            s = t_ecc(s) if repo == "ecc" else t_agency(s, slug) if repo == "agency" else s
            s = add_origin(s, repo, "agent")
            write(roster_dir / division / f"{slug}.md", s)
            report["roster"].setdefault(division, []).append(slug)

    # ---- rules (ECC) ----
    copy_tree(src("ecc", "rules"), T / "rules", t_ecc)

    # ---- templates ----
    for repo, rel, dest in TEMPLATES:
        write(T / "templates" / dest, TRANSFORMS[repo](read(src(repo, rel))))
        report["templates"].append(dest)

    # ---- playbooks / contexts ----
    for repo, rel, dest in PLAYBOOKS:
        sp = src(repo, rel)
        dp = (T / "playbooks" / dest).resolve()
        if sp.is_dir():
            copy_tree(sp, dp, TRANSFORMS[repo])
        else:
            write(dp, TRANSFORMS[repo](read(sp)))
        report["playbooks"].append(dest)

    # ---- provenance manifest ----
    write(T / "upstream" / "manifest.json", json.dumps(report, indent=2) + "\n")
    print(f"skills: {len(report['skills'])}  core agents: {len(report['agents'])}  "
          f"roster: {sum(len(v) for v in report['roster'].values())}  templates: {len(report['templates'])}")

if __name__ == "__main__":
    main()
