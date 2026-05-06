# Topic 01 Proof of Concept

Student: Proof Student <proof.student@example.com>

Topic: Cloud-hosted Task Collaboration Platform

## What this demonstrates

This proof-of-concept implements the core workflow expected from the assignment:

- task CRUD
- assignee and priority metadata
- activity/audit trail
- attachment metadata
- cloud-service readiness panel for auth, database, storage, deployment, and config
- local persistence for a demo run

The app is intentionally static so it can run from GitHub Pages or a local file without a build step. In a production version, the same data model maps to managed auth, a managed SQL table for tasks/activity, and object storage for files.

## Run locally

Open `index.html` in a browser, or serve this folder:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

## Test

Run the lightweight verification script from this folder:

```bash
node check-solution.js
```

Expected output:

```text
Proof-of-concept checks passed.
```

## Deployment

This folder can be published through GitHub Pages, Netlify, Vercel, or any static hosting provider. The demo URL in `SUBMISSIONS_2026.md` points to the expected GitHub Pages path.

## Cloud architecture target

- Auth: managed identity provider
- Database: `tasks`, `activity_events`, `attachments`
- Storage: object bucket for uploaded files
- Functions: optional endpoint for attachment signing and task notifications
- Deployment: static frontend plus serverless API or BaaS integration
