#!/usr/bin/env node
// Node 18+
// Creates preliminary MCC 2026 evaluation rows for submitted assignments that
// do not already have an instructor-managed evaluation. It uses public metadata
// only and intentionally does not execute student code.

const fs = require('fs');

const submissionsFile = 'SUBMISSIONS_2026.md';
const evaluationsFile = 'EVALUATIONS_2026.md';
const token = process.env.GITHUB_TOKEN || '';
const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');

const submissionPattern = /^(\d{2})\.\s+(.+?)\s—\s\(Submitted by ([^)]+)\)\s—\sRepo:\s+(\S+)\s—\sDemo:\s+(.+)$/;
const evaluationPattern = /^(\d{2})\.\s+(.+?)\s—\sScore:\s+(\d{1,2})\/30\s—\sStatus:\s+(Reviewed|Needs fixes|Pending review)\s—\sFeedback EN:\s+(.+?)\s—\sFeedback SQ:\s+(.+)$/;
const emailPattern = /<?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})>?/;

function readText(path) {
  return fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '';
}

function parseIdentity(value) {
  const emailMatch = value.match(emailPattern);
  const email = emailMatch ? emailMatch[1].trim() : '';
  const name = value
    .replace(/<[^<>]+>/g, '')
    .replace(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { name, email };
}

function parseSubmissions(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().match(submissionPattern))
    .filter(Boolean)
    .map((match) => ({
      id: match[1],
      title: match[2].trim(),
      identity: parseIdentity(match[3]),
      repoUrl: match[4].trim(),
      demoUrl: match[5].trim(),
    }));
}

function parseEvaluations(text) {
  const evaluations = new Map();
  const header = [];
  const rows = [];

  text.split(/\r?\n/).forEach((line) => {
    const match = line.trim().match(evaluationPattern);
    if (!match) {
      if (!rows.length) header.push(line);
      return;
    }
    const row = {
      id: match[1],
      title: match[2].trim(),
      score: Number(match[3]),
      status: match[4],
      feedbackEn: match[5].trim(),
      feedbackSq: match[6].trim(),
      raw: line.trim(),
    };
    evaluations.set(row.id, row);
    rows.push(row);
  });

  return { header, rows, evaluations };
}

function parseGithubRepo(urlValue) {
  try {
    const parsed = new URL(urlValue.replace(/\.git$/i, ''));
    if (parsed.hostname.toLowerCase() !== 'github.com') return null;
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/i, ''),
    };
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'mcc-2026-auto-grader',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function githubJson(path) {
  const response = await fetchWithTimeout(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) return null;
  return response.json();
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function readRepoFile(owner, repo, branch, path) {
  const encodedPath = encodePath(path);
  const encodedBranch = encodeURIComponent(branch);
  const data = await githubJson(`/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodedBranch}`);
  if (!data || data.type !== 'file' || !data.content) return '';
  return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
}

async function inspectGithubRepo(repoUrl) {
  const parsed = parseGithubRepo(repoUrl);
  if (!parsed) {
    return {
      ok: false,
      reason: 'Repository URL is not a GitHub repository URL.',
      files: [],
      readmeText: '',
      aiLogText: '',
      commitCount: 0,
    };
  }

  const repo = await githubJson(`/repos/${parsed.owner}/${parsed.repo}`);
  if (!repo) {
    return {
      ok: false,
      reason: 'Repository is not publicly accessible through the GitHub API.',
      files: [],
      readmeText: '',
      aiLogText: '',
      commitCount: 0,
    };
  }

  const branch = repo.default_branch || 'main';
  const tree = await githubJson(`/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  const files = Array.isArray(tree && tree.tree)
    ? tree.tree.filter((item) => item.type === 'blob').map((item) => item.path)
    : [];
  const lowerFiles = files.map((file) => file.toLowerCase());
  const readmePath = files.find((file) => /^readme(\.[a-z0-9]+)?$/i.test(file.split('/').pop() || ''));
  const aiLogPath = files.find((file) => /(^|\/)ai[-_ ]?log\.txt$/i.test(file));
  const readmeText = readmePath ? await readRepoFile(parsed.owner, parsed.repo, branch, readmePath) : '';
  const aiLogText = aiLogPath ? await readRepoFile(parsed.owner, parsed.repo, branch, aiLogPath) : '';
  const commits = await githubJson(`/repos/${parsed.owner}/${parsed.repo}/commits?per_page=5`);

  return {
    ok: true,
    reason: '',
    owner: parsed.owner,
    repo: parsed.repo,
    branch,
    files,
    lowerFiles,
    readmeText,
    aiLogText,
    commitCount: Array.isArray(commits) ? commits.length : 0,
  };
}

async function inspectDemo(demoUrl) {
  if (/^(N\/A|NA)$/i.test(demoUrl.trim())) {
    return { provided: false, ok: false, status: 0, reason: 'Demo URL is N/A.' };
  }

  try {
    let response = await fetchWithTimeout(demoUrl, { method: 'HEAD' }, 10000);
    if (response.status === 405 || response.status === 403) {
      response = await fetchWithTimeout(demoUrl, { method: 'GET' }, 10000);
    }
    return {
      provided: true,
      ok: response.status >= 200 && response.status < 400,
      status: response.status,
      reason: response.status >= 200 && response.status < 400
        ? 'Demo URL responds successfully.'
        : `Demo URL responded with HTTP ${response.status}.`,
    };
  } catch (error) {
    return {
      provided: true,
      ok: false,
      status: 0,
      reason: `Demo URL could not be reached: ${error.name || 'request failed'}.`,
    };
  }
}

function hasAny(values, patterns) {
  return patterns.some((pattern) => values.some((value) => pattern.test(value)));
}

function countKeywordHits(text, keywords) {
  const normalized = text.toLowerCase();
  return keywords.filter((keyword) => normalized.includes(keyword)).length;
}

function compactSentence(parts) {
  return parts
    .filter(Boolean)
    .join('; ')
    .replace(/\s+/g, ' ')
    .replace(/\s—\s/g, ' - ')
    .trim();
}

function gradeSubmission(submission, repo, demo) {
  let score = 0;
  const evidence = [];
  const weak = [];
  const allFiles = repo.lowerFiles || [];
  const joinedFiles = allFiles.join('\n');
  const readme = repo.readmeText || '';
  const searchable = `${joinedFiles}\n${readme}`.toLowerCase();

  if (repo.ok) {
    score += 5;
    evidence.push('public GitHub repository is reachable');
  } else {
    weak.push(repo.reason);
  }

  if (readme.length >= 200) {
    score += 2;
    evidence.push('README is present');
    if (/(install|setup|run|deploy|environment|configuration|npm|pnpm|yarn|docker|firebase|vercel|supabase|render|netlify)/i.test(readme)) {
      score += 2;
      evidence.push('README includes setup or deployment guidance');
    } else {
      weak.push('README lacks clear setup or deployment guidance');
    }
    if (/(screenshot|demo|architecture|database|api|cloud|mobile|auth|storage)/i.test(readme)) {
      score += 1;
    }
  } else {
    weak.push('README is missing or too short');
  }

  const hasManifest = hasAny(allFiles, [
    /(^|\/)package\.json$/,
    /(^|\/)requirements\.txt$/,
    /(^|\/)pyproject\.toml$/,
    /(^|\/)pubspec\.yaml$/,
    /(^|\/)build\.gradle(\.kts)?$/,
    /(^|\/)pom\.xml$/,
    /(^|\/)dockerfile$/,
  ]);
  const hasSource = hasAny(allFiles, [
    /(^|\/)(src|app|pages|components|server|api|functions|lib)\//,
    /\.(js|jsx|ts|tsx|py|dart|kt|swift|java|go|php)$/,
  ]);
  if (hasManifest && hasSource) {
    score += 4;
    evidence.push('source structure and dependency manifest are present');
  } else if (hasManifest || hasSource) {
    score += 2;
    weak.push('source structure or dependency manifest is incomplete');
  } else {
    weak.push('no clear runnable source structure was detected');
  }

  const cloudKeywords = [
    'firebase',
    'firestore',
    'supabase',
    'aws',
    'azure',
    'google cloud',
    'gcp',
    'vercel',
    'netlify',
    'render',
    'fly.io',
    'serverless',
    'cloud function',
    'lambda',
    'postgres',
    'mongodb',
    'storage',
    'auth',
    'oauth',
    'queue',
    'cron',
    'monitoring',
    'fcm',
    'push notification',
    'kubernetes',
    'docker',
  ];
  const cloudHits = Math.min(5, countKeywordHits(searchable, cloudKeywords));
  if (cloudHits >= 3) {
    score += 5;
    evidence.push('cloud or MCC service evidence is visible');
  } else if (cloudHits > 0) {
    score += 2;
    weak.push('cloud or MCC evidence is present but thin');
  } else {
    weak.push('cloud or MCC service evidence was not detected');
  }

  if (demo.ok) {
    score += 5;
    evidence.push('public demo responds successfully');
  } else if (!demo.provided && /(local|localhost|npm run|docker compose|flutter run|expo)/i.test(readme)) {
    score += 2;
    weak.push('demo is N/A but local run guidance exists');
  } else if (demo.provided && demo.status >= 400 && demo.status < 500) {
    score += 2;
    weak.push(demo.reason);
  } else {
    weak.push(demo.reason);
  }

  if ((repo.aiLogText || '').trim().length >= 100) {
    score += 2;
    evidence.push('AI-log.txt is present');
  } else {
    weak.push('AI-log.txt is missing or too short');
  }

  if (repo.commitCount >= 3) {
    score += 2;
    evidence.push('at least three recent commits are visible');
  } else if (repo.commitCount > 0) {
    score += 1;
    weak.push('fewer than three recent commits were visible');
  }

  if (hasAny(allFiles, [
    /(^|\/)\.github\/workflows\/.+\.ya?ml$/,
    /(^|\/)docker-compose\.ya?ml$/,
    /(^|\/)dockerfile$/,
    /(^|\/)vercel\.json$/,
    /(^|\/)netlify\.toml$/,
    /(^|\/)firebase\.json$/,
    /(^|\/)render\.ya?ml$/,
    /(^|\/)fly\.toml$/,
    /(^|\/)terraform\//,
    /\.(tf)$/,
  ])) {
    score += 2;
    evidence.push('deployment or CI configuration is present');
  } else {
    weak.push('deployment or CI configuration was not detected');
  }

  const finalScore = Math.max(0, Math.min(30, score));
  const status = finalScore < 15 || !repo.ok ? 'Needs fixes' : 'Pending review';
  const evidenceText = compactSentence(evidence.slice(0, 4));
  const weakText = compactSentence(weak.slice(0, 4));
  const feedbackEn = compactSentence([
    `Automated preliminary score based on public repository metadata, README/setup evidence, cloud signals, demo availability, AI log, commit history, and CI/deployment files`,
    evidenceText ? `Evidence found: ${evidenceText}` : '',
    weakText ? `Needs manual attention: ${weakText}` : '',
    'Instructor should confirm runtime behavior, security, and feature completeness before treating this as final',
  ]);
  const feedbackSq = compactSentence([
    `Pike paraprake automatike bazuar ne metadata publike te repository-t, README/setup, sinjale cloud, demo, AI-log, historik commit-esh dhe CI/deployment`,
    evidenceText ? `Evidenca: ${evidenceText}` : '',
    weakText ? `Kerkohet kontroll manual: ${weakText}` : '',
    'Mesimdhenesi duhet te konfirmoje runtime, sigurine dhe plotesine e funksioneve para vleresimit final',
  ]);

  return { score: finalScore, status, feedbackEn, feedbackSq };
}

function renderEvaluation(row) {
  return `${row.id}. ${row.title} — Score: ${row.score}/30 — Status: ${row.status} — Feedback EN: ${row.feedbackEn} — Feedback SQ: ${row.feedbackSq}`;
}

function renderEvaluations(header, rows) {
  const cleanHeader = header.join('\n').replace(/\s+$/g, '');
  const body = rows
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(renderEvaluation)
    .join('\n\n');
  return `${cleanHeader}\n\n${body}\n`;
}

async function main() {
  const submissions = parseSubmissions(readText(submissionsFile));
  const { header, rows, evaluations } = parseEvaluations(readText(evaluationsFile));
  const additions = [];

  for (const submission of submissions) {
    if (evaluations.has(submission.id)) continue;

    console.log(`Checking submission ${submission.id}: ${submission.title}`);
    const repo = await inspectGithubRepo(submission.repoUrl);
    const demo = await inspectDemo(submission.demoUrl);
    const grade = gradeSubmission(submission, repo, demo);
    const row = {
      id: submission.id,
      title: submission.title,
      ...grade,
    };
    additions.push(row);
    console.log(`Prepared ${submission.id}: ${grade.score}/30 (${grade.status})`);
  }

  if (!additions.length) {
    console.log('No unevaluated submitted assignments found.');
    return;
  }

  additions.forEach((row) => {
    console.log(renderEvaluation(row));
  });

  if (dryRun) {
    console.log(`Dry run only. Would add ${additions.length} evaluation row(s).`);
    return;
  }

  fs.writeFileSync(evaluationsFile, renderEvaluations(header, [...rows, ...additions]));
  console.log(`Added ${additions.length} evaluation row(s) to ${evaluationsFile}.`);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
