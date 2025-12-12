// Node 18+
// Validates that the PR changes exactly one topic line in TOPICS.md,
// switches (Available) -> (Taken by Name), and that the topic wasn't already taken.

const fs = require('fs');
const { execSync } = require('child_process');

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

const filePath = 'TOPICS.md';
if (!fs.existsSync(filePath)) fail('TOPICS.md not found in repo root.');

const before = fs.readFileSync(filePath, 'utf8');

const lines = before.split(/\r?\n/);
const errors = [];
let claims = 0;

const topicLinePattern = /^(\d{2})\.\s+(.+?)\s—\s\((Available|Taken by [^)]+)\)$/;
const claimPattern = /^(\d{2})\.\s+(.+?)\s—\s\(Taken by ([^)]+)\)$/;

lines.forEach((ln, idx) => {
  const trimmed = ln.trim();
  if (!trimmed) return;

  if (/^\d{2}\./.test(trimmed)) {
    if (!topicLinePattern.test(trimmed)) {
      errors.push(`Line ${idx + 1}: Topic line must follow "NN. Title — (Available|Taken by Name)" format.`);
      return;
    }

    const claimMatch = trimmed.match(claimPattern);
    if (claimMatch) {
      claims += 1;
      const id = claimMatch[1];
      const name = claimMatch[3];
      if (!name.trim()) {
        errors.push(`Line ${idx + 1}: Claimed topic ${id} must include a non-empty name.`);
      }
    }
  }
});

// Prevent double-claim format issues:
lines.forEach((ln, idx) => {
  const taken = ln.match(/\(Taken by [^)]+\)/g);
  if (taken && taken.length > 1) errors.push(`Line ${idx + 1}: Multiple "(Taken by ...)" found.`);
});

function tryDiff(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    return '';
  }
}

function getDiff() {
  const attempts = [
    'git diff --unified=0 -- TOPICS.md',
    'git diff --cached --unified=0 -- TOPICS.md',
  ];

  for (const cmd of attempts) {
    const diff = tryDiff(cmd);
    if (diff.trim()) return diff;
  }

  const hasParent = tryDiff('git rev-parse --verify HEAD^');
  if (hasParent.trim()) {
    const diff = tryDiff('git diff --unified=0 HEAD^ HEAD -- TOPICS.md');
    if (diff.trim()) return diff;
  }

  const baseRef = process.env.GITHUB_BASE_REF;
  if (baseRef) {
    let diff = tryDiff(`git diff --unified=0 origin/${baseRef}...HEAD -- TOPICS.md`);
    if (diff.trim()) return diff;
    diff = tryDiff(`git diff --unified=0 ${baseRef}...HEAD -- TOPICS.md`);
    if (diff.trim()) return diff;
  }

  return '';
}

const diff = getDiff();

if (claims === 0) {
  if (diff.trim()) {
    errors.push('No "(Taken by ...)" found. Did you edit TOPICS.md correctly?');
  } else {
    console.log('ℹ️ TOPICS.md contains no claimed topics yet.');
  }
}

if (diff.trim()) {
  const diffLines = diff
    .split(/\r?\n/)
    .filter((ln) => /^[+-]/.test(ln) && !/^[+-]{3}/.test(ln));

  const additions = diffLines.filter((ln) => ln.startsWith('+'));
  const removals = diffLines.filter((ln) => ln.startsWith('-'));

  if (additions.length !== 1 || removals.length !== 1) {
    errors.push('You must change exactly one topic line in TOPICS.md.');
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
      errors.push('The new line must end with "(Taken by YOUR FULL NAME)".');
    } else {
      const name = claimMatch[3].trim();
      if (name.length < 3) {
        errors.push('Please provide your full name inside "(Taken by ...)".');
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('✅ Claim format looks valid.');
