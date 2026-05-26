#!/usr/bin/env python3
"""Send evaluation emails for MCC 2026 submissions.

The script is intended for GitHub Actions. On a normal push it sends only
evaluation lines that were added or changed in EVALUATIONS_2026.md. On manual
workflow runs it can send all evaluations or a selected comma-separated list of
topic IDs.
"""

from __future__ import annotations

import os
import re
import smtplib
import subprocess
from dataclasses import dataclass
from email.message import EmailMessage
from pathlib import Path


EVALUATIONS_FILE = "EVALUATIONS_2026.md"
SUBMISSIONS_FILE = "SUBMISSIONS_2026.md"
CLOUD_TOPICS_FILE = "CLOUD_TOPICS_2026.md"

EVALUATION_RE = re.compile(
    r"^(\d{2})\.\s+(.+?)\s—\sScore:\s+(\d{1,2}/30)\s—\sStatus:\s+"
    r"(Reviewed|Needs fixes|Pending review)\s—\sFeedback EN:\s+(.+?)\s—\sFeedback SQ:\s+(.+)$"
)
SUBMISSION_RE = re.compile(
    r"^(\d{2})\.\s+(.+?)\s—\s\(Submitted by ([^)]+)\)\s—\sRepo:\s+(\S+)\s—\sDemo:\s+(.+)$"
)
TOPIC_RE = re.compile(r"^(\d{2})\.\s+(.+?)\s—\s\((Taken by .+?)\)$")
EMAIL_RE = re.compile(r"<?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})>?")


@dataclass(frozen=True)
class Evaluation:
    topic_id: str
    title: str
    score: str
    status: str
    feedback_en: str
    feedback_sq: str
    raw: str


@dataclass(frozen=True)
class Student:
    name: str
    email: str
    repo: str = ""
    demo: str = ""


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def truthy(value: str) -> bool:
    return value.lower() in {"1", "true", "yes", "y", "on"}


def read_text(path: str) -> str:
    file_path = Path(path)
    if not file_path.exists():
        return ""
    return file_path.read_text(encoding="utf-8", errors="replace")


def git_show(ref: str, path: str) -> str:
    if not ref or set(ref) == {"0"}:
        return ""
    try:
        return subprocess.check_output(
            ["git", "show", f"{ref}:{path}"],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        return ""


def parse_identity(value: str) -> tuple[str, str]:
    email_match = EMAIL_RE.search(value)
    email = email_match.group(1).strip() if email_match else ""
    name = value
    name = re.sub(r"^Taken by\s+", "", name).strip()
    if email_match:
        name = name[: email_match.start()].strip()
    return re.sub(r"\s+", " ", name), email


def parse_evaluations(text: str) -> dict[str, Evaluation]:
    evaluations: dict[str, Evaluation] = {}
    for line in text.splitlines():
        match = EVALUATION_RE.match(line.strip())
        if not match:
            continue
        evaluations[match.group(1)] = Evaluation(
            topic_id=match.group(1),
            title=match.group(2).strip(),
            score=match.group(3).strip(),
            status=match.group(4).strip(),
            feedback_en=match.group(5).strip(),
            feedback_sq=match.group(6).strip(),
            raw=line.strip(),
        )
    return evaluations


def parse_submissions(text: str) -> dict[str, Student]:
    students: dict[str, Student] = {}
    for line in text.splitlines():
        match = SUBMISSION_RE.match(line.strip())
        if not match:
            continue
        name, email = parse_identity(match.group(3))
        students[match.group(1)] = Student(
            name=name,
            email=email,
            repo=match.group(4).strip(),
            demo=match.group(5).strip(),
        )
    return students


def parse_reservations(text: str) -> dict[str, Student]:
    students: dict[str, Student] = {}
    for line in text.splitlines():
        match = TOPIC_RE.match(line.strip())
        if not match or not match.group(3).startswith("Taken by "):
            continue
        name, email = parse_identity(match.group(3))
        students[match.group(1)] = Student(name=name, email=email)
    return students


def selected_ids(current: dict[str, Evaluation], previous: dict[str, Evaluation]) -> list[str]:
    explicit = env("EVALUATION_IDS")
    if explicit:
        if explicit.lower() == "all":
            return sorted(current)
        requested = [item.strip().zfill(2) for item in explicit.split(",") if item.strip()]
        return [topic_id for topic_id in requested if topic_id in current]

    if truthy(env("SEND_ALL_EVALUATIONS")):
        return sorted(current)

    changed: list[str] = []
    for topic_id, evaluation in current.items():
        old = previous.get(topic_id)
        if old is None or old.raw != evaluation.raw:
            changed.append(topic_id)
    return sorted(changed)


def smtp_ready() -> bool:
    required = ("SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM")
    missing = [name for name in required if not env(name)]
    if missing:
        print(f"Skipping email delivery; missing SMTP setting(s): {', '.join(missing)}")
        return False
    return True


def status_instruction(status: str) -> tuple[str, str]:
    if status == "Needs fixes":
        return (
            "Please fix the issues listed in the feedback, update your repository/demo, "
            "and open a new PR in SUBMISSIONS_2026.md if the repository or demo URL changes. "
            "Keep the same full name and email used in your reservation/submission.",
            "Ju lutem rregulloni problemet e listuara në feedback, përditësoni repository-n/demo-n "
            "dhe hapni PR të ri në SUBMISSIONS_2026.md nëse ndryshon linku i repository-t ose demos. "
            "Mbani të njëjtin emër të plotë dhe email si në rezervim/dorëzim.",
        )
    if status == "Pending review":
        return (
            "Your submission is still pending final review. No action is required unless the instructor asks for changes.",
            "Dorëzimi juaj është ende në pritje të vlerësimit final. Nuk kërkohet veprim, përveç nëse mësimdhënësi kërkon ndryshime.",
        )
    return (
        "Your submission has been reviewed. If you want to improve it after feedback, update the project repository and contact the instructor before opening another PR.",
        "Dorëzimi juaj është vlerësuar. Nëse dëshironi ta përmirësoni pas feedback-ut, përditësoni repository-n e projektit dhe kontaktoni mësimdhënësin para se të hapni PR tjetër.",
    )


def build_message(evaluation: Evaluation, student: Student) -> EmailMessage:
    repo_line = f"Repository: {student.repo}" if student.repo else "Repository: not found in SUBMISSIONS_2026.md"
    demo_line = f"Demo: {student.demo}" if student.demo else "Demo: not found in SUBMISSIONS_2026.md"
    instruction_en, instruction_sq = status_instruction(evaluation.status)
    public_url = "https://arbenl.github.io/arbenl-mobile-assignments-2025/evaluations-2026.html"

    body = f"""Hello {student.name or 'student'},

Your Cloud Computing / Mobile Cloud Computing 2026 assignment has been evaluated.

Topic: {evaluation.topic_id}. {evaluation.title}
Score: {evaluation.score}
Status: {evaluation.status}
{repo_line}
{demo_line}

Feedback:
{evaluation.feedback_en}

What to do next:
{instruction_en}

Public evaluation page:
{public_url}

---

Përshëndetje {student.name or 'student'},

Detyra juaj për Cloud Computing / Mobile Cloud Computing 2026 është vlerësuar.

Tema: {evaluation.topic_id}. {evaluation.title}
Pikët: {evaluation.score}
Statusi: {evaluation.status}
{repo_line}
{demo_line}

Feedback:
{evaluation.feedback_sq}

Çfarë duhet të bëni më tutje:
{instruction_sq}

Faqja publike e vlerësimeve:
{public_url}
"""

    message = EmailMessage()
    message["Subject"] = f"MCC 2026 evaluation: {evaluation.topic_id}. {evaluation.title} - {evaluation.score}"
    message["From"] = env("SMTP_FROM")
    message["To"] = student.email
    reply_to = env("SMTP_REPLY_TO")
    if reply_to:
        message["Reply-To"] = reply_to
    message.set_content(body)
    return message


def send_email(message: EmailMessage) -> None:
    host = env("SMTP_HOST")
    port = int(env("SMTP_PORT") or "587")
    username = env("SMTP_USERNAME")
    password = env("SMTP_PASSWORD")
    use_ssl = truthy(env("SMTP_SSL")) or port == 465

    if use_ssl:
        with smtplib.SMTP_SSL(host, port, timeout=30) as smtp:
            smtp.login(username, password)
            smtp.send_message(message)
    else:
        with smtplib.SMTP(host, port, timeout=30) as smtp:
            smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(message)


def main() -> None:
    current = parse_evaluations(read_text(EVALUATIONS_FILE))
    previous = parse_evaluations(git_show(env("BEFORE_SHA"), EVALUATIONS_FILE))
    submissions = parse_submissions(read_text(SUBMISSIONS_FILE))
    reservations = parse_reservations(read_text(CLOUD_TOPICS_FILE))

    topic_ids = selected_ids(current, previous)
    if not topic_ids:
        print("No new or changed evaluation rows found.")
        return

    dry_run = truthy(env("DRY_RUN"))
    if not dry_run and not smtp_ready():
        return

    sent = 0
    skipped = 0
    for topic_id in topic_ids:
        evaluation = current[topic_id]
        student = submissions.get(topic_id) or reservations.get(topic_id)
        if not student or not student.email:
            print(f"Skipping {topic_id}; no student email found.")
            skipped += 1
            continue

        message = build_message(evaluation, student)
        if dry_run:
            print(f"DRY RUN: would send {topic_id} to {student.name} <{student.email}>")
        else:
            send_email(message)
            print(f"Sent evaluation email for {topic_id} to {student.email}.")
        sent += 1

    print(f"Evaluation email job complete. Sent: {sent}. Skipped: {skipped}.")


if __name__ == "__main__":
    main()
