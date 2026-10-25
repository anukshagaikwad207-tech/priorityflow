'use strict';

// A binary max-heap implements the priority queue used by the scheduler.
class MaxHeap {
  constructor(compare) { this.items = []; this.compare = compare; }
  get size() { return this.items.length; }
  push(item) {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.compare(this.items[i], this.items[parent]) <= 0) break;
      [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
      i = parent;
    }
  }
  pop() {
    if (!this.items.length) return null;
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length) {
      this.items[0] = last;
      let i = 0;
      while (true) {
        const left = i * 2 + 1, right = left + 1;
        let largest = i;
        if (left < this.items.length && this.compare(this.items[left], this.items[largest]) > 0) largest = left;
        if (right < this.items.length && this.compare(this.items[right], this.items[largest]) > 0) largest = right;
        if (largest === i) break;
        [this.items[i], this.items[largest]] = [this.items[largest], this.items[i]];
        i = largest;
      }
    }
    return top;
  }
}

const $ = (id) => document.getElementById(id);
const DEFAULT_TASKS = [
  { name: 'Database backup', priority: 8, cpu: 3, memory: 4, work: 2 },
  { name: 'Image processing', priority: 6, cpu: 4, memory: 6, work: 3 },
  { name: 'Email service', priority: 5, cpu: 2, memory: 2, work: 2 },
  { name: 'Report generation', priority: 4, cpu: 3, memory: 5, work: 2 },
  { name: 'Log cleanup', priority: 2, cpu: 1, memory: 1, work: 1 },
  { name: 'User analytics', priority: 3, cpu: 2, memory: 3, work: 2 }
];
let tasks = [], nextId = 1, cycle = 0, logEntries = [], completedCount = 0;
let cpuCapacity = 8, memoryCapacity = 16, lastCpuUsed = 0, lastMemoryUsed = 0;

function resetSimulation() {
  nextId = 1; cycle = 0; completedCount = 0; logEntries = []; lastCpuUsed = 0; lastMemoryUsed = 0;
  tasks = DEFAULT_TASKS.map((t) => ({ ...t, id: nextId++, wait: 0, remaining: t.work, status: 'Queued', runs: 0 }));
  addLog('Simulation reset', 'Sample tasks have been loaded. Priorities and resource use are ready to explore.', '↻');
  render();
}
function effectivePriority(task) { return Math.min(10, task.priority + Math.floor(task.wait / 2)); }
function compareTasks(a, b) {
  const difference = effectivePriority(a) - effectivePriority(b);
  if (difference !== 0) return difference;
  if (a.wait !== b.wait) return a.wait - b.wait;
  return b.id - a.id; // older task wins a tie
}
function addLog(title, detail, icon = '•') {
  logEntries.unshift({ title, detail, icon, cycle });
  logEntries = logEntries.slice(0, 18);
}
function runCycle() {
  const queued = tasks.filter(t => t.status !== 'Completed');
  if (!queued.length) { setMessage('All tasks are complete. Reset or add another task to continue.'); return false; }
  cycle++;
  const heap = new MaxHeap(compareTasks);
  queued.forEach(t => heap.push(t));
  let selected = null;
  const skipped = [];
  while (heap.size) {
    const candidate = heap.pop();
    if (candidate.cpu <= cpuCapacity && candidate.memory <= memoryCapacity) { selected = candidate; break; }
    skipped.push(candidate);
  }
  if (!selected) {
    lastCpuUsed = 0; lastMemoryUsed = 0;
    queued.forEach(t => { t.wait++; t.status = 'Blocked'; });
    addLog('No task fits current capacity', `Increase CPU or memory capacity. ${queued.length} task(s) are waiting for sufficient resources.`, '!');
    setMessage('No waiting task fits the current CPU and memory limits. Adjust capacity and try again.');
    render(); return false;
  }
  queued.forEach(t => { if (t.id !== selected.id) { t.wait++; if (t.status !== 'Completed') t.status = 'Queued'; } });
  selected.status = 'Running'; selected.runs++; selected.remaining--;
  lastCpuUsed = selected.cpu; lastMemoryUsed = selected.memory;
  const chosenPriority = effectivePriority(selected);
  addLog(`Scheduled ${selected.name}`, `Effective priority ${chosenPriority}/10 · used ${selected.cpu} CPU unit(s) and ${selected.memory} GB memory.`, '▶');
  if (selected.remaining <= 0) {
    selected.status = 'Completed'; completedCount++;
    addLog(`${selected.name} completed`, `Finished after ${selected.runs} successful allocation cycle(s).`, '✓');
    setMessage(`${selected.name} completed successfully in cycle ${cycle}.`);
  } else {
    selected.status = 'Queued';
    setMessage(`${selected.name} received one work unit. ${selected.remaining} work unit(s) remain.`);
  }
  render(); return true;
}
function setMessage(message) { $('schedulerMessage').textContent = message; }
function statusClass(status) { return ({ Queued: 'status-queued', Running: 'status-running', Completed: 'status-completed', Blocked: 'status-blocked' })[status] || 'status-queued'; }
function renderTasks() {
  const tbody = $('taskTableBody'); tbody.innerHTML = '';
  $('emptyState').classList.toggle('hidden', tasks.length > 0);
  tasks.forEach(task => {
    const tr = document.createElement('tr');
    const initials = task.name.split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase();
    const effective = task.status === 'Completed' ? '—' : effectivePriority(task);
    tr.innerHTML = `<td><div class="task-name"><div class="task-avatar">${initials}</div><div><strong></strong><small></small></div></div></td>
      <td><span class="priority-number">${task.priority}/10</span></td><td><span class="effective-number">${effective}${effective === '—' ? '' : '/10'}</span></td>
      <td>${task.cpu} units</td><td>${task.memory} GB</td><td>${task.wait} cycle(s)</td>
      <td><span class="status ${statusClass(task.status)}">${task.status}</span></td>
      <td><div class="action-group"><button class="small-action" data-action="up" data-id="${task.id}" aria-label="Increase priority" ${task.status === 'Completed' || task.priority >= 10 ? 'disabled' : ''}>P+</button><button class="small-action" data-action="down" data-id="${task.id}" aria-label="Decrease priority" ${task.status === 'Completed' || task.priority <= 1 ? 'disabled' : ''}>P−</button><button class="small-action" data-action="remove" data-id="${task.id}" aria-label="Remove task" ${task.status === 'Completed' ? 'disabled' : ''}>×</button></div></td>`;
    tr.querySelector('.task-name strong').textContent = task.name;
    tr.querySelector('.task-name small').textContent = `${task.remaining} work unit(s) remaining`;
    tbody.appendChild(tr);
  });
}
function renderLog() {
  const list = $('logList'); list.innerHTML = '';
  if (!logEntries.length) { list.innerHTML = '<div class="log-empty">No events yet. Run a scheduling cycle to see decisions here.</div>'; return; }
  logEntries.slice(0, 7).forEach(entry => {
    const row = document.createElement('div'); row.className = 'log-entry';
    row.innerHTML = `<div class="log-marker"></div><div><strong></strong><p></p></div><span class="log-time">Cycle ${entry.cycle}</span>`;
    row.querySelector('.log-marker').textContent = entry.icon;
    row.querySelector('strong').textContent = entry.title;
    row.querySelector('p').textContent = entry.detail;
    list.appendChild(row);
  });
}
function render() {
  cpuCapacity = Number($('cpuCapacity').value); memoryCapacity = Number($('memoryCapacity').value);
  // Metrics represent the most recent successful allocation cycle.
  const usedCpu = lastCpuUsed;
  const usedMemory = lastMemoryUsed;
  $('totalTasks').textContent = tasks.length;
  $('completedTasks').textContent = completedCount;
  $('cpuCapacityLabel').textContent = cpuCapacity; $('memoryCapacityLabel').textContent = memoryCapacity;
  $('cpuUtil').textContent = `${Math.round(usedCpu / cpuCapacity * 100)}%`;
  $('cpuBar').style.width = `${Math.min(100, usedCpu / cpuCapacity * 100)}%`;
  $('memoryUtil').textContent = `${usedMemory} / ${memoryCapacity} GB`;
  $('memoryBar').style.width = `${Math.min(100, usedMemory / memoryCapacity * 100)}%`;
  $('cpuAllocated').textContent = `${usedCpu} / ${cpuCapacity}`;
  $('memoryAllocated').textContent = `${usedMemory} / ${memoryCapacity} GB`;
  $('cycleCount').textContent = cycle;
  $('runCycleBtn').disabled = tasks.length > 0 && tasks.every(t => t.status === 'Completed');
  $('runAllBtn').disabled = $('runCycleBtn').disabled;
  renderTasks(); renderLog();
}

$('runCycleBtn').addEventListener('click', runCycle);
$('runAllBtn').addEventListener('click', () => {
  let attempts = 0;
  while (attempts < 100 && tasks.some(t => t.status !== 'Completed')) {
    const before = cycle; const ran = runCycle(); attempts++;
    if (!ran || cycle === before) break;
  }
  if (attempts >= 100) setMessage('Stopped after 100 cycles to keep the browser responsive.');
});
$('resetBtn').addEventListener('click', () => { resetSimulation(); setMessage('Simulation reset. Ready to schedule tasks.'); });
$('cpuCapacity').addEventListener('input', () => { render(); setMessage('CPU capacity updated. Run a cycle to apply the new limit.'); });
$('memoryCapacity').addEventListener('input', () => { render(); setMessage('Memory capacity updated. Run a cycle to apply the new limit.'); });
$('addTaskBtn').addEventListener('click', () => { $('formError').textContent = ''; $('taskForm').reset(); $('taskDialog').showModal(); $('taskName').focus(); });
$('closeDialogBtn').addEventListener('click', () => $('taskDialog').close());
$('taskForm').addEventListener('submit', event => {
  event.preventDefault();
  const name = $('taskName').value.trim();
  const priority = Number($('taskPriority').value), cpu = Number($('taskCpu').value), memory = Number($('taskMemory').value), work = Number($('taskWork').value);
  if (!name) { $('formError').textContent = 'Please enter a task name.'; return; }
  if (tasks.some(t => t.name.toLowerCase() === name.toLowerCase() && t.status !== 'Completed')) { $('formError').textContent = 'An active task with this name already exists.'; return; }
  if (![priority, cpu, memory, work].every(Number.isFinite) || priority < 1 || priority > 10 || cpu < 1 || cpu > 16 || memory < 1 || memory > 64 || work < 1 || work > 5) { $('formError').textContent = 'Check the limits: priority 1–10, CPU 1–16, memory 1–64 GB, work 1–5.'; return; }
  tasks.push({ id: nextId++, name, priority, cpu, memory, work, remaining: work, wait: 0, status: 'Queued', runs: 0 });
  addLog(`Added ${name}`, `Priority ${priority}/10 · ${cpu} CPU unit(s) · ${memory} GB memory · ${work} work unit(s).`, '+');
  $('taskDialog').close(); setMessage(`${name} added to the queue.`); render();
});
$('taskTableBody').addEventListener('click', event => {
  const button = event.target.closest('button[data-action]'); if (!button) return;
  const task = tasks.find(t => t.id === Number(button.dataset.id)); if (!task) return;
  const action = button.dataset.action;
  if (action === 'up') { task.priority = Math.min(10, task.priority + 1); addLog(`Priority increased: ${task.name}`, `Base priority is now ${task.priority}/10.`, '↑'); }
  else if (action === 'down') { task.priority = Math.max(1, task.priority - 1); addLog(`Priority decreased: ${task.name}`, `Base priority is now ${task.priority}/10.`, '↓'); }
  else if (action === 'remove') { tasks = tasks.filter(t => t.id !== task.id); addLog(`Removed ${task.name}`, 'Task removed from the simulation queue.', '×'); }
  render();
});
$('clearLogBtn').addEventListener('click', () => { logEntries = []; renderLog(); });
resetSimulation();
