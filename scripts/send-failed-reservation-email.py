#!/usr/bin/env python3
"""Send an optional email when a reservation PR fails validation.

The workflow calls this from a trusted checkout during pull_request_target.
It reads the PR diff, extracts the student's email from added lines or PR
metadata, and skips cleanly when SMTP secrets or a recipient are unavailable.
"""

from __future__ import annotations

import os
import json
import re
import smtplib
import subprocess
from email.message import EmailMessage
from pathlib import Path


EMAIL_RE = re.compile(r"<?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})>?")
SUPPORTED_FILES = ("TOPICS.md", "CLOUD_TOPICS_2026.md", "SUBMISSIONS_2026.md")


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def read_text(path: str, limit: int | None = None) -> str:
    file_path = Path(path)
    if not file_path.exists():
        return ""

    text = file_path.read_text(encoding="utf-8", errors="replace")
    if limit is not None:
        return "\n".join(text.splitlines()[:limit])
    return text


def run_git_diff(pr_dir: str, base_ref: str) -> str:
    args = ["git", "diff", "--unified=0", f"{base_ref}...HEAD", "--", *SUPPORTED_FILES]
    try:
        return subprocess.check_output(args, cwd=pr_dir, text=True, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        return ""


def event_pull_request() -> dict:
    event_path = env("GITHUB_EVENT_PATH")
    if not event_path:
        return {}

    try:
        event = json.loads(Path(event_path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}

    pull_request = event.get("pull_request")
    return pull_request if isinstance(pull_request, dict) else {}


def first_email(values: list[str]) -> str:
    for value in values:
        match = EMAIL_RE.search(value or "")
        if match:
            return match.group(1)
    return ""


def extract_recipient() -> str:
    explicit = env("STUDENT_EMAIL")
    if explicit and EMAIL_RE.fullmatch(explicit):
        return explicit

    diff = run_git_diff(env("PR_DIR", "pr"), env("GITHUB_BASE_REF", "main"))
    added_lines = [
        line[1:].strip()
        for line in diff.splitlines()
        if line.startswith("+") and not line.startswith("+++")
    ]
    pull_request = event_pull_request()

    return first_email([
        *added_lines,
        env("PR_TITLE"),
        env("PR_BODY"),
        str(pull_request.get("title") or ""),
        str(pull_request.get("body") or ""),
    ])


def smtp_ready() -> bool:
    required = ("SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM")
    missing = [name for name in required if not env(name)]
    if missing:
        print(f"Skipping email notification; missing SMTP setting(s): {', '.join(missing)}")
        return False
    return True


def build_message(recipient: str) -> EmailMessage:
    validation_output = read_text(env("VALIDATION_OUTPUT", "validation-output.txt"), limit=120)
    pull_request = event_pull_request()
    pr_number = env("PR_NUMBER") or str(pull_request.get("number") or "")
    pr_url = env("PR_URL") or str(pull_request.get("html_url") or "")
    pr_title = env("PR_TITLE") or str(pull_request.get("title") or "Reservation PR")

    body = f"""Hello,

Your MCC 2026 reservation Pull Request did not pass automatic validation.

PR: #{pr_number} - {pr_title}
Link: {pr_url}

What went wrong:
{validation_output}

Correct format:
NN. Topic Title — (Taken by Full Name <email@example.com>)

How to fix it:
- Edit only CLOUD_TOPICS_2026.md.
- Change exactly one existing topic line from (Available) to (Taken by Full Name <email@example.com>).
- Keep the topic ID and title exactly the same.
- Keep the Cloud focus and Score lines.
- Do not edit mcc-2026.html.
- Do not rename files.
- One student can reserve only one assignment.
- If the PR is messy, close it and open a new PR from a clean fork/branch.

---

Pershendetje,

Pull Request-i juaj per rezervimin MCC 2026 nuk e kaloi validimin automatik.

PR: #{pr_number} - {pr_title}
Link: {pr_url}

Cfare shkoi gabim:
{validation_output}

Formati i sakte:
NN. Titulli i temes — (Taken by Emri Mbiemri <email@example.com>)

Si ta rregulloni:
- Ndryshoni vetem CLOUD_TOPICS_2026.md.
- Ndryshoni saktesisht nje rresht ekzistues nga (Available) ne (Taken by Emri Mbiemri <email@example.com>).
- Ruani ID-ne dhe titullin e temes pa ndryshime.
- Mos fshini rreshtat Cloud focus dhe Score.
- Mos editoni mcc-2026.html.
- Mos riemertoni fajlla.
- Nje student mund te rezervoje vetem nje detyre.
- Nese PR-ja eshte bere rremuje, mbylleni dhe hapni nje PR te ri nga fork/branch i paster.
"""

    message = EmailMessage()
    message["Subject"] = env("SMTP_SUBJECT", "MCC 2026 reservation PR failed")
    message["From"] = env("SMTP_FROM")
    message["To"] = recipient
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
    use_ssl = env("SMTP_SSL", "false").lower() in {"1", "true", "yes"} or port == 465

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
    if not smtp_ready():
        return

    recipient = extract_recipient()
    if not recipient:
        print("Skipping email notification; no student email found in PR diff or metadata.")
        return

    send_email(build_message(recipient))
    print(f"Sent failed reservation email to {recipient}.")


if __name__ == "__main__":
    main()
