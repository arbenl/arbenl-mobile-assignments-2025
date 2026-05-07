// Node 18+
// Validates that a student PR changes exactly one topic line in one supported
// catalogue, switches (Available) -> (Taken by Name <email>), and preserves the topic.
// All other catalogue metadata, score lines, pages, and scripts are read-only
// for student claim PRs.

const fs = require('fs');
const { execSync } = require('child_process');

const topicFiles = ['TOPICS.md', 'CLOUD_TOPICS_2026.md'];
const submissionFile = 'SUBMISSIONS_2026.md';
const topicLinePattern = /^(\d{2})\.\s+(.+?)\s—\s\((Available|Taken by [^)]+)\)$/;
const claimPattern = /^(\d{2})\.\s+(.+?)\s—\s\(Taken by ([^)]+)\)$/;
const scoreLinePattern = /^\s+-\s+Score:\s+(Not graded \(0-30\)|([0-9]|[12][0-9]|30)\/30)$/;
const submissionOpenPattern = /^(\d{2})\.\s+(.+?)\s—\s\(Not submitted\)$/;
const submissionDonePattern = /^(\d{2})\.\s+(.+?)\s—\s\(Submitted by ([^)]+)\)\s—\sRepo:\s+(https?:\/\/\S+)\s—\sDemo:\s+(https?:\/\/\S+|N\/A|n\/a|NA|na)$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const existingClaims = [];

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function tryDiff(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    return '';
  }
}

function validateTopicFile(filePath, errors) {
  if (!fs.existsSync(filePath)) return 0;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  let claims = 0;

  lines.forEach((ln, idx) => {
    const trimmed = ln.trim();
    if (!trimmed) return;

    if (/^\d{2}\./.test(trimmed)) {
      if (!topicLinePattern.test(trimmed)) {
        errors.push(
          `${filePath}:${idx + 1}: Topic line must follow "NN. Title — (Available|Taken by Name)" format.`,
        );
        return;
      }

      const claimMatch = trimmed.match(claimPattern);
      if (claimMatch) {
        claims += 1;
        const id = claimMatch[1];
        const identity = parseClaimIdentity(claimMatch[3]);
        if (!identity.name.trim()) {
          errors.push(`${filePath}:${idx + 1}: Claimed topic ${id} must include a non-empty name.`);
        }
        existingClaims.push({
          filePath,
          line: idx + 1,
          id,
          name: identity.name,
          email: identity.email,
        });
      }
    }

    if (/^\s+-\s+Score:/.test(ln) && !scoreLinePattern.test(ln)) {
      errors.push(`${filePath}:${idx + 1}: Score must be "Not graded (0-30)" or "N/30" where N is 0-30.`);
    }

    const taken = ln.match(/\(Taken by [^)]+\)/g);
    if (taken && taken.length > 1) {
      errors.push(`${filePath}:${idx + 1}: Multiple "(Taken by ...)" found.`);
    }
  });

  return claims;
}

function validateSubmissionFile(errors) {
  if (!fs.existsSync(submissionFile)) return;

  const lines = fs.readFileSync(submissionFile, 'utf8').split(/\r?\n/);
  lines.forEach((ln, idx) => {
    const trimmed = ln.trim();
    if (!/^\d{2}\./.test(trimmed)) return;

    const openMatch = trimmed.match(submissionOpenPattern);
    const doneMatch = trimmed.match(submissionDonePattern);
    if (!openMatch && !doneMatch) {
      errors.push(
        `${submissionFile}:${idx + 1}: Submission line must be "NN. Title — (Not submitted)" or "NN. Title — (Submitted by Name <email>) — Repo: https://... — Demo: https://...|N/A".`,
      );
      return;
    }

    if (doneMatch) {
      const identity = parseClaimIdentity(doneMatch[3]);
      if (identity.name.length < 3) {
        errors.push(`${submissionFile}:${idx + 1}: Submitted solution must include the student's full name.`);
      }
      if (!emailPattern.test(identity.email)) {
        errors.push(`${submissionFile}:${idx + 1}: Submitted solution must include a valid email.`);
      }
    }
  });
}

function parseClaimIdentity(value) {
  const emailMatch = value.match(/<([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)>|([^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)/);
  const email = emailMatch ? (emailMatch[1] || emailMatch[2]).trim() : '';
  const name = value
    .replace(/<[^<>]+>/g, '')
    .replace(/[^\s]+@[^\s]+/g, '')
    .replace(/[(),]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { name, email };
}

function normalizeName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getDiff() {
  const fileArgs = [...topicFiles, submissionFile].join(' ');
  const attempts = [
    `git diff --unified=0 -- ${fileArgs}`,
    `git diff --cached --unified=0 -- ${fileArgs}`,
  ];

  for (const cmd of attempts) {
    const diff = tryDiff(cmd);
    if (diff.trim()) return diff;
  }

  const baseRef = process.env.GITHUB_BASE_REF;
  if (baseRef) {
    let diff = tryDiff(`git diff --unified=0 origin/${baseRef}...HEAD -- ${fileArgs}`);
    if (diff.trim()) return diff;
    diff = tryDiff(`git diff --unified=0 ${baseRef}...HEAD -- ${fileArgs}`);
    if (diff.trim()) return diff;
  }

  const hasParent = tryDiff('git rev-parse --verify HEAD^');
  if (hasParent.trim()) {
    const diff = tryDiff(`git diff --unified=0 HEAD^ HEAD -- ${fileArgs}`);
    if (diff.trim()) return diff;
  }

  return '';
}

function getChangedFiles() {
  const attempts = [
    'git diff --name-only',
    'git diff --cached --name-only',
  ];

  for (const cmd of attempts) {
    const diff = tryDiff(cmd);
    if (diff.trim()) return diff.trim().split(/\r?\n/).filter(Boolean);
  }

  const baseRef = process.env.GITHUB_BASE_REF;
  if (baseRef) {
    let diff = tryDiff(`git diff --name-only origin/${baseRef}...HEAD`);
    if (diff.trim()) return diff.trim().split(/\r?\n/).filter(Boolean);
    diff = tryDiff(`git diff --name-only ${baseRef}...HEAD`);
    if (diff.trim()) return diff.trim().split(/\r?\n/).filter(Boolean);
  }

  const hasParent = tryDiff('git rev-parse --verify HEAD^');
  if (hasParent.trim()) {
    const diff = tryDiff('git diff --name-only HEAD^ HEAD');
    if (diff.trim()) return diff.trim().split(/\r?\n/).filter(Boolean);
  }

  return [];
}

function getCurrentBranch() {
  return (process.env.GITHUB_HEAD_REF || tryDiff('git branch --show-current')).trim();
}

function isCourseMaintenancePr(changedFiles) {
  const actor = process.env.GITHUB_ACTOR || '';
  const branch = getCurrentBranch();
  const isOwnerAutomation = actor === 'arbenl' || actor === '';
  const hasMaintenanceFiles = changedFiles.some((file) => (
    file === 'scripts/check-claim.js'
    || file.startsWith('.github/workflows/')
    || file === '.github/pull_request_template.md'
    || file === 'README.md'
    || file === 'AGENTS.md'
    || file.endsWith('.html')
    || file.startsWith('poc-solutions/')
  ));

  return isOwnerAutomation && /^codex\//.test(branch) && hasMaintenanceFiles;
}

const errors = [];
let claims = 0;

topicFiles.forEach((filePath) => {
  claims += validateTopicFile(filePath, errors);
});
validateSubmissionFile(errors);

if (!topicFiles.some((filePath) => fs.existsSync(filePath))) {
  fail(`No supported topic catalogue found. Expected one of: ${topicFiles.join(', ')}`);
}

const diff = getDiff();
const changedFiles = getChangedFiles();
const changedTopicFiles = changedFiles.filter((file) => topicFiles.includes(file));
const changedSubmissionFiles = changedFiles.filter((file) => file === submissionFile);
const courseMaintenancePr = isCourseMaintenancePr(changedFiles);

if (!courseMaintenancePr && changedFiles.length && !diff.trim()) {
  errors.push(
    `Student PRs may change exactly one allowed file only: ${topicFiles.join(', ')} or ${submissionFile}. Scores, pages, scripts, and docs are read-only for students.`,
  );
}

if (claims === 0 && changedSubmissionFiles.length === 0) {
  if (!courseMaintenancePr && diff.trim()) {
    errors.push('No "(Taken by ...)" found. Did you edit a supported topic catalogue correctly?');
  } else {
    console.log('ℹ️ Supported topic catalogues contain no claimed topics yet.');
  }
}

if (!courseMaintenancePr && diff.trim()) {
  const isClaimChange = changedFiles.length === 1 && changedTopicFiles.length === 1;
  const isSubmissionChange = changedFiles.length === 1 && changedSubmissionFiles.length === 1;

  if (!isClaimChange && !isSubmissionChange) {
    errors.push(
      `Student PRs may change exactly one allowed file only: ${topicFiles.join(', ')} or ${submissionFile}. Scores, pages, scripts, and docs are read-only for students.`,
    );
  }

  const diffLines = diff
    .split(/\r?\n/)
    .filter((ln) => /^[+-]/.test(ln) && !/^[+-]{3}/.test(ln));

  const additions = diffLines.filter((ln) => ln.startsWith('+'));
  const removals = diffLines.filter((ln) => ln.startsWith('-'));

  if (additions.length !== 1 || removals.length !== 1) {
    errors.push('You must change exactly one line in the chosen allowed file.');
  } else if (isSubmissionChange) {
    const addedLine = additions[0].slice(1).trim();
    const removedLine = removals[0].slice(1).trim();

    const addedMatch = addedLine.match(submissionDonePattern);
    const removedMatch = removedLine.match(submissionOpenPattern);

    if (!removedMatch) {
      errors.push('The submission entry you are updating was not marked as "(Not submitted)".');
    }
    if (!addedMatch) {
      errors.push('The new submission line must follow: "NN. Title — (Submitted by Full Name <email>) — Repo: https://... — Demo: https://...|N/A".');
    }

    if (addedMatch && removedMatch) {
      if (addedMatch[1] !== removedMatch[1] || addedMatch[2] !== removedMatch[2]) {
        errors.push('Submission topic title or ID was modified. Only change the submission segment.');
      }

      const identity = parseClaimIdentity(addedMatch[3]);
      if (identity.name.length < 3) {
        errors.push('Please provide your full name in the submission line.');
      }
      if (!emailPattern.test(identity.email)) {
        errors.push('Please provide a valid email in the submission line.');
      }

      const reservation = existingClaims.find((claim) => (
        claim.id === addedMatch[1]
        && (
          normalizeName(claim.name) === normalizeName(identity.name)
          || (identity.email && claim.email && claim.email.toLowerCase() === identity.email.toLowerCase())
        )
      ));

      if (!reservation) {
        errors.push('Final submission must match the student name/email on the reserved topic ID.');
      }
    }
  } else {
    const addedLine = additions[0].slice(1).trim();
    const removedLine = removals[0].slice(1).trim();

    if (!topicLinePattern.test(addedLine)) {
      errors.push('The added line is not a valid topic entry.');
    }

    if (!topicLinePattern.test(removedLine)) {
      errors.push('The removed line is not a valid topic entry.');
    }

    const statusStripper = (line) => line.replace(/\s—\s\((Available|Taken by [^)]+)\)$/, '');

    if (topicLinePattern.test(addedLine) && topicLinePattern.test(removedLine)) {
      if (statusStripper(addedLine) !== statusStripper(removedLine)) {
        errors.push('Topic title or ID was modified. Only change the status segment.');
      }
    }

    if (!/\(Available\)$/.test(removedLine)) {
      errors.push('The topic you are claiming was not marked as "(Available)".');
    }

    const claimMatch = addedLine.match(claimPattern);
    if (!claimMatch) {
      errors.push('The new line must end with "(Taken by YOUR FULL NAME <YOUR EMAIL>)".');
    } else {
      const claimedId = claimMatch[1];
      const identity = parseClaimIdentity(claimMatch[3]);
      if (identity.name.length < 3) {
        errors.push('Please provide your full name inside "(Taken by ...)".');
      }
      if (!emailPattern.test(identity.email)) {
        errors.push('Please provide a valid email inside "(Taken by YOUR FULL NAME <email@example.com>)".');
      }

      const duplicate = existingClaims.find((claim) => (
        !(claim.filePath === changedTopicFiles[0] && claim.id === claimedId)
        && (
          normalizeName(claim.name) === normalizeName(identity.name)
          || (identity.email && claim.email && claim.email.toLowerCase() === identity.email.toLowerCase())
        )
      ));

      if (duplicate) {
        errors.push(
          `One student can reserve only one assignment. ${identity.name} already appears on topic ${duplicate.id}.`,
        );
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

if (courseMaintenancePr) {
  console.log('ℹ️ Course maintenance PR detected; validated catalogue and submission formats.');
}

console.log('✅ Claim format looks valid.');
