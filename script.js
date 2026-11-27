(() => {
  "use strict";

  const STORAGE_KEY = "todo-list-app:items";

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-inpuut");
  const listEl = document.getElementById("todo-list");
  const countEl = document.getElementById("count");
  const toggleAllBtn = document.getElementById("toggle-all");
  const clearBtn = document.getElementById("clear-completed");
  const filterBtns = document.querySelectorAll(".filter-btn");

  let todos = load();
  let filter = "all";

  // ---------- Storage ----------
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (err) {
      // Storage unavailable (private mode, quota). The app still works for this session.
    }
  }

  // ---------- Actions ----------
  function addTodo(text) {
    todos.push({ id: Date.now() + Math.random(), text, completed: false });
    commit();
  }

  function toggleTodo(id, completed) {
    const todo = todos.find(t => t.id === id);
    if (todo) todo.completed = completed;
    commit();
  }

  function editTodo(id, text) {
    const todo = todos.find(t => t.id === id);
    if (todo && text) todo.text = text;
    commit();
  }

  function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    commit();
  }

  function toggleAll() {
    const allDone = todos.length > 0 && todos.every(t => t.completed);
    todos.forEach(t => { t.completed = !allDone; });
    commit();
  }

  function clearCompleted() {
    todos = todos.filter(t => !t.completed);
    commit();
  }

  function commit() {
    save();
    render();
  }

  // ---------- Rendering ----------
  function visibleTodos() {
    if (filter === "active") return todos.filter(t => !t.completed);
    if (filter === "completed") return todos.filter(t => t.completed);
    return todos;
  }

  function render() {
    listEl.innerHTML = "";
    const items = visibleTodos();

    if (items.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = todos.length === 0
        ? "No tasks yet. Add your first one above."
        : "No tasks in this view.";
      listEl.appendChild(li);
    }

    items.forEach(todo => listEl.appendChild(createItem(todo)));

    const left = todos.filter(t => !t.completed).length;
    countEl.textContent = `${left} ${left === 1 ? "task" : "tasks"} left`;

    const allDone = todos.length > 0 && todos.every(t => t.completed);
    toggleAllBtn.textContent = allDone ? "Mark all active" : "Complete all";
    toggleAllBtn.disabled = todos.length === 0;
    clearBtn.disabled = !todos.some(t => t.completed);

    filterBtns.forEach(btn =>
      btn.setAttribute("aria-pressed", String(btn.dataset.filter === filter)));
  }

  function createItem(todo) {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", `Mark done: ${todo.text}`);
    checkbox.addEventListener("change", () => toggleTodo(todo.id, checkbox.checked));

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;
    text.title = "Double-click to edit";
    text.addEventListener("dblclick", () => startEdit(li, text, todo));

    const del = document.createElement("button");
    del.className = "btn delete-btn";
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete: ${todo.text}`);
    del.addEventListener("click", () => deleteTodo(todo.id));

    li.append(checkbox, text, del);
    return li;
  }

  function startEdit(li, textEl, todo) {
    const editor = document.createElement("input");
    editor.type = "text";
    editor.className = "edit-input";
    editor.value = todo.text;
    editor.maxLength = 200;
    editor.setAttribute("aria-label", "Edit task");

    let finished = false;
    const finish = (saveChange) => {
      if (finished) return;
      finished = true;
      if (saveChange) {
        const value = editor.value.trim();
        if (value) { editTodo(todo.id, value); return; }
      }
      render();
    };

    editor.addEventListener("keydown", e => {
      if (e.key === "Enter") finish(true);
      if (e.key === "Escape") finish(false);
    });
    editor.addEventListener("blur", () => finish(true));

    li.replaceChild(editor, textEl);
    editor.focus();
    editor.select();
  }

  // ---------- Events ----------
  form.addEventListener("submit", e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addTodo(text);
    input.value = "";
    input.focus();
  });

  filterBtns.forEach(btn =>
    btn.addEventListener("click", () => {
      filter = btn.dataset.filter;
      render();
    }));

  toggleAllBtn.addEventListener("click", toggleAll);
  clearBtn.addEventListener("click", clearCompleted);

  // Keep multiple open tabs in sync
  window.addEventListener("storage", e => {
    if (e.key === STORAGE_KEY) {
      todos = load();
      render();
    }
  });

  render();
})();
