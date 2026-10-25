# Dynamic Priority-Based Resource Allocation

**PriorityFlow** is an interactive browser-based simulator that demonstrates how a system can allocate limited CPU and memory resources to competing tasks using a priority queue. It includes dynamic priority updates, a fairness mechanism called *aging*, resource constraints, and basic scheduling metrics.

## Features

- Custom **binary max-heap** used as a priority queue.
- Dynamic base-priority increase/decrease for each waiting task.
- **Priority aging:** a waiting task gains one effective-priority point for every two waiting cycles, up to 10, reducing the chance of starvation.
- Resource constraints for CPU units and memory capacity.
- One-cycle scheduling and run-until-blocked controls.
- Add and remove tasks with configurable priority, resource needs, and work units.
- Dashboard metrics for total/completed tasks, CPU utilization, memory usage, and cycle count.
- Allocation log explaining scheduling choices.
- Responsive layout; runs locally without a server or package installation.

## How to run

1. Download or clone this repository.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox, etc.).
3. Use **Run next cycle** to schedule one work unit, or **Run until blocked** to keep scheduling until all tasks finish or none can fit the current capacity.
4. Adjust CPU/memory capacity, change priorities with `P+` / `P−`, or add your own tasks.

No build step, API key, or external backend is required. Google Fonts are used for typography when internet access is available; the app still works offline with fallback fonts.

## Scheduling logic

1. Each scheduling cycle creates a max-heap from tasks that are not complete.
2. The heap orders tasks by effective priority. Higher effective priority wins; waiting time breaks ties, then older tasks win remaining ties.
3. The scheduler removes tasks from the heap until it finds one whose CPU and memory requirements fit the configured capacity.
4. The selected task receives one work unit. Other incomplete tasks accrue waiting time.
5. Effective priority is `min(10, basePriority + floor(waitCycles / 2))`.
6. A task completes when its remaining work units reach zero. If no waiting task fits, the scheduler reports a resource-capacity block rather than allocating beyond limits.

### Complexity

For `n` waiting tasks, building the heap by repeated insertion and selecting a suitable task take up to **O(n log n)** time per cycle in this implementation. Heap storage is **O(n)**. The simple dashboard renders all tasks after each action.

## Important design note

This is an educational **discrete-cycle simulator**, not a real operating-system scheduler. A successful cycle models one work unit and resource fit; resources are not held concurrently between cycles. CPU utilization and memory in use show the resources used in the most recent successful allocation cycle; a blocked cycle resets these readings to zero. This keeps the model easy to inspect and explain.

## Suggested demo

1. Start with the sample tasks and run one cycle.
2. Increase `Log cleanup` priority and run another cycle to see the order change.
3. Lower CPU capacity below a task's requirement and observe resource-aware selection.
4. Set capacity too low for every queued task to see the blocked message.
5. Run several cycles and watch waiting tasks gain effective priority through aging.
6. Add a task and compare its base priority, effective priority, and resource needs.

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Custom binary max-heap / priority queue

## Repository structure

```text
Dynamic-Priority-Resource-Allocation/
├── index.html   # Dashboard structure and task form
├── style.css    # Responsive styling
├── app.js       # Priority queue, scheduler, fairness, metrics, and events
├── README.md    # Documentation and demo instructions
└── LICENSE      # MIT license
```

## Team

College assignment: Dynamic Priority-Based Resource Allocation.

Add or update the team details according to your faculty's submission requirements.

## License

MIT — see [LICENSE](LICENSE).
