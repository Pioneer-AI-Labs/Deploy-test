// Simple Todo/Task App with LocalStorage Persistence

class TodoApp {
  constructor() {
    this.tasks = [];
    this.taskInput = document.getElementById('taskInput');
    this.addBtn = document.getElementById('addBtn');
    this.taskList = document.getElementById('taskList');

    // Load tasks from localStorage on page load
    this.loadTasks();

    // Event listeners
    this.addBtn.addEventListener('click', () => this.addTask());
    this.taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTask();
    });
  }

  // Add a new task
  addTask() {
    const taskText = this.taskInput.value.trim();

    if (taskText === '') {
      alert('Please enter a task!');
      return;
    }

    const task = {
      id: Date.now(),
      text: taskText,
      completed: false
    };

    this.tasks.push(task);
    this.saveTasks();
    this.renderTasks();
    this.taskInput.value = '';
    this.taskInput.focus();
  }

  // Mark task as complete/incomplete
  toggleComplete(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
    }
  }

  // Delete a task
  deleteTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveTasks();
    this.renderTasks();
  }

  // Render all tasks to the DOM
  renderTasks() {
    this.taskList.innerHTML = '';

    if (this.tasks.length === 0) {
      this.taskList.innerHTML = '<p style="text-align: center; color: #999;">No tasks yet. Add one to get started!</p>';
      return;
    }

    this.tasks.forEach(task => {
      const taskElement = document.createElement('li');
      taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
      taskElement.innerHTML = `
        <div class="task-content">
          <input
            type="checkbox"
            class="task-checkbox"
            ${task.completed ? 'checked' : ''}
            onchange="app.toggleComplete(${task.id})"
          />
          <span class="task-text">${this.escapeHtml(task.text)}</span>
        </div>
        <button class="delete-btn" onclick="app.deleteTask(${task.id})">Delete</button>
      `;
      this.taskList.appendChild(taskElement);
    });
  }

  // Save tasks to localStorage
  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  // Load tasks from localStorage
  loadTasks() {
    const saved = localStorage.getItem('tasks');
    this.tasks = saved ? JSON.parse(saved) : [];
    this.renderTasks();
  }

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TodoApp();
});
