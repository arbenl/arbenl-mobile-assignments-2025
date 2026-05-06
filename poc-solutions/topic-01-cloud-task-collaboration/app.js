const storageKey = 'topic-01-cloud-task-poc';

const taskForm = document.getElementById('taskForm');
const titleInput = document.getElementById('titleInput');
const assigneeInput = document.getElementById('assigneeInput');
const priorityInput = document.getElementById('priorityInput');
const attachmentInput = document.getElementById('attachmentInput');
const taskList = document.getElementById('taskList');
const activityList = document.getElementById('activityList');
const seedButton = document.getElementById('seedButton');
const taskTemplate = document.getElementById('taskTemplate');

const state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Array.isArray(saved.tasks) && Array.isArray(saved.activity)) {
      return saved;
    }
  } catch (error) {
    // Ignore invalid local demo state.
  }

  return {
    tasks: [],
    activity: [],
  };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function addActivity(message) {
  state.activity.unshift({
    id: crypto.randomUUID(),
    message,
    at: new Date().toLocaleString(),
  });
  state.activity = state.activity.slice(0, 8);
}

function addTask(task) {
  state.tasks.unshift({
    id: crypto.randomUUID(),
    done: false,
    createdAt: new Date().toISOString(),
    ...task,
  });
  addActivity(`Created task "${task.title}" for ${task.assignee}`);
  saveState();
  render();
}

function toggleTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  task.done = !task.done;
  addActivity(`${task.done ? 'Completed' : 'Reopened'} task "${task.title}"`);
  saveState();
  render();
}

function deleteTask(id) {
  const index = state.tasks.findIndex((item) => item.id === id);
  if (index === -1) return;
  const [task] = state.tasks.splice(index, 1);
  addActivity(`Deleted task "${task.title}"`);
  saveState();
  render();
}

function seedDemoData() {
  state.tasks = [];
  state.activity = [];
  addTask({
    title: 'Create Supabase schema for tasks',
    assignee: 'Backend Partner',
    priority: 'High',
    attachment: 'schema-notes.md',
  });
  addTask({
    title: 'Prepare deployment checklist',
    assignee: 'Proof Student',
    priority: 'Medium',
    attachment: 'deployment-plan.pdf',
  });
  addActivity('Loaded proof-of-concept demo data');
  saveState();
  render();
}

function render() {
  taskList.innerHTML = '';
  activityList.innerHTML = '';

  if (state.tasks.length === 0) {
    taskList.innerHTML = '<p class="empty">No tasks yet. Create one or load demo data.</p>';
  }

  state.tasks.forEach((task) => {
    const node = taskTemplate.content.firstElementChild.cloneNode(true);
    node.classList.toggle('done', task.done);
    node.querySelector('h3').textContent = task.title;
    node.querySelector('p').textContent = `${task.priority} priority - ${task.assignee} - Attachment: ${task.attachment || 'none'}`;
    node.querySelector('.done-button').textContent = task.done ? 'Reopen' : 'Done';
    node.querySelector('.done-button').addEventListener('click', () => toggleTask(task.id));
    node.querySelector('.delete-button').addEventListener('click', () => deleteTask(task.id));
    taskList.appendChild(node);
  });

  state.activity.forEach((event) => {
    const item = document.createElement('li');
    item.textContent = `${event.at}: ${event.message}`;
    activityList.appendChild(item);
  });
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTask({
    title: titleInput.value.trim(),
    assignee: assigneeInput.value,
    priority: priorityInput.value,
    attachment: attachmentInput.value.trim(),
  });
  taskForm.reset();
});

seedButton.addEventListener('click', seedDemoData);

render();
