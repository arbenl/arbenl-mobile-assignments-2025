// Node 18+
// Exports valid open Cloud/MCC reservation PR claims into a static JSON file
// for GitHub Pages. This avoids unauthenticated browser GitHub API rate limits.

const fs = require('fs');

const repo = process.env.GITHUB_REPOSITORY || 'arbenl/arbenl-mobile-assignments-2025';
const token = process.env.GITHUB_TOKEN || '';
const outputPath = process.argv[2] || 'pending-reservations-2026.json';
const topicFile = 'CLOUD_TOPICS_2026.md';
const topicLinePattern = /^(\d{2})\.\s+(.+?)\s—\s\((Available|Taken by [^)]+)\)$/;
const claimLinePattern = /^(\d{2})\.\s+(.+?)\s—\s\(Taken by ([^)]+)\)$/;

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

function sameStudent(left, right) {
  const leftEmail = (left.email || '').trim().toLowerCase();
  const rightEmail = (right.email || '').trim().toLowerCase();
  return (
    (leftEmail && rightEmail && leftEmail === rightEmail)
    || normalizeName(left.name || '') === normalizeName(right.name || '')
  );
}

function parseOfficialClaims() {
  if (!fs.existsSync(topicFile)) return [];

  return fs.readFileSync(topicFile, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim().match(claimLinePattern))
    .filter(Boolean)
    .map((match) => {
      const identity = parseClaimIdentity(match[3]);
      return {
        id: match[1],
        title: match[2],
        name: identity.name,
        email: identity.email,
      };
    });
}

function parseClaimsFromPatch(patch, pull) {
  return patch
    .split(/\r?\n/)
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1).trim())
    .filter((line) => topicLinePattern.test(line))
    .map((line) => line.match(claimLinePattern))
    .filter(Boolean)
    .map((match) => {
      const identity = parseClaimIdentity(match[3]);
      return {
        id: match[1],
        title: match[2],
        name: identity.name,
        email: identity.email,
        prNumber: pull.number,
        prTitle: pull.title,
        prUrl: pull.html_url,
        author: pull.user ? pull.user.login : '',
        createdAt: pull.created_at,
      };
    });
}

async function githubJson(path) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'mcc-pending-reservations-export',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API ${path} failed with ${response.status}`);
  }
  return response.json();
}

function classifyClaims(rawClaims, officialClaims) {
  const claims = [];
  const conflicts = [];
  const seenTopics = new Set();
  const seenStudents = [];

  rawClaims
    .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))
    .forEach((claim) => {
      const officialTopic = officialClaims.find((official) => official.id === claim.id);
      if (officialTopic) {
        conflicts.push({
          ...claim,
          reason: `Topic ${claim.id} is already officially reserved by ${officialTopic.name}.`,
        });
        return;
      }

      const officialStudent = officialClaims.find((official) => sameStudent(official, claim));
      if (officialStudent) {
        conflicts.push({
          ...claim,
          reason: `${claim.name} already officially reserved topic ${officialStudent.id}.`,
        });
        return;
      }

      if (seenTopics.has(claim.id)) {
        conflicts.push({
          ...claim,
          reason: `Topic ${claim.id} already has an earlier open reservation PR.`,
        });
        return;
      }

      const pendingStudent = seenStudents.find((student) => sameStudent(student, claim));
      if (pendingStudent) {
        conflicts.push({
          ...claim,
          reason: `${claim.name} already has earlier open reservation PR #${pendingStudent.prNumber}.`,
        });
        return;
      }

      claims.push(claim);
      seenTopics.add(claim.id);
      seenStudents.push(claim);
    });

  return { claims, conflicts };
}

async function main() {
  const pulls = await githubJson('/pulls?state=open&per_page=100');
  const claimBatches = await Promise.all(pulls.map(async (pull) => {
    const files = await githubJson(`/pulls/${pull.number}/files`);
    const changedTopicFile = files.find((file) => file.filename === topicFile);
    if (!changedTopicFile || !changedTopicFile.patch) return [];
    return parseClaimsFromPatch(changedTopicFile.patch, pull);
  }));

  const officialClaims = parseOfficialClaims();
  const { claims, conflicts } = classifyClaims(claimBatches.flat(), officialClaims);
  const output = {
    generatedAt: new Date().toISOString(),
    source: `https://github.com/${repo}/pulls`,
    claims,
    conflicts,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Exported ${claims.length} pending reservation(s) and ${conflicts.length} conflict(s) to ${outputPath}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
