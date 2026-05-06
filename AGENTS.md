# Repository Guidelines

## Project Structure & Module Organization
- `TOPICS.md` at the root is the mobile assignment catalogue, and `CLOUD_TOPICS_2026.md` is the Cloud Computing/MCC 2026 catalogue; student claims may change only one `NN. Title — (Status)` line in one catalogue. New claims must use `Taken by Full Name <email@example.com>`, and one student can reserve only one assignment. Score lines in the cloud catalogue are instructor-managed and use `Not graded (0-30)` or `N/30`.
- `SUBMISSIONS_2026.md` is the final solution index for Cloud/MCC 2026; students may change only one line from `Not submitted` to the required submitted format with matching name/email, repo URL, and demo URL or `N/A`.
- `scripts/check-claim.js` is the Node 18 validator that inspects the Git diff of supported topic catalogues; keep it untouched unless you coordinate with staff.
- `.github/workflows/validate-claim.yml` runs the validator on PRs, and `.github/pull_request_template.md` captures the student details instructors need.
- `README.md` explains the claim workflow, while `CODEOWNERS` routes every PR to the teaching team—leave both in place.

## Build, Test, and Development Commands
- `node scripts/check-claim.js` — execute after any topic claim; it fails fast when more than one line changes or formatting slips.
- `git status && git diff --stat` — verify that only the chosen topic line updated before staging.
- `gh pr create` (optional) — open the claim PR from the CLI with the template ready to fill.

## Coding Style & Naming Conventions
- Maintain two-space indenting for nested Markdown bullets and keep the long dash `—` between metadata and status.
- Topic IDs stay zero-padded (`01`, `02`, …) and titles remain identical to the catalogue copy to keep automation reliable.
- Use descriptive branch names like `claim-topic-07`; add new files in lowercase-hyphenated form if supplementary assets are ever required.

## Testing Guidelines
- Treat `node scripts/check-claim.js` as the single required test and run it locally before pushing.
- If CI fails, pull the PR branch, rerun the validator, and inspect `git diff --unified=0 TOPICS.md CLOUD_TOPICS_2026.md` to spot stray changes.

## Commit & Pull Request Guidelines
- Keep commit subjects short and imperative, mirroring existing history such as `Add Expo Snack guidance for all topics`; include the topic ID when claiming.
- Complete every field of `.github/pull_request_template.md` and mention the validator result (`✅ Claim format looks valid.`) in the PR discussion.
- Share screenshots or extra context only when adding collateral beyond the claim itself.

## Automation & CI Notes
- GitHub Actions runs `Validate Topic Claim` on each PR to `main`; match that workflow locally so reviewers see a green check on first pass.
- If automation blocks the PR after the validator succeeds, contact the teaching team via Discussions or the course channel for guidance.
