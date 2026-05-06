const fs = require('fs');

const requiredFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'README.md',
  'AI-log.txt',
];

const requiredHtmlTokens = [
  'Cloud-hosted Task Collaboration Platform',
  'Create task',
  'Team board',
  'Activity stream',
  'Cloud service checklist',
];

const requiredJsTokens = [
  'localStorage',
  'addTask',
  'toggleTask',
  'deleteTask',
  'addActivity',
  'seedDemoData',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

for (const token of requiredHtmlTokens) {
  if (!html.includes(token)) {
    throw new Error(`Missing HTML feature: ${token}`);
  }
}

for (const token of requiredJsTokens) {
  if (!js.includes(token)) {
    throw new Error(`Missing JavaScript feature: ${token}`);
  }
}

console.log('Proof-of-concept checks passed.');
