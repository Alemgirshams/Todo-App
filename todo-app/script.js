let todos = [];
let currentTheme = 'light';

// Pomodoro Timer Variables
let timeLeft;
let timerId = null;
let isTimerRunning = false;
const timerModes = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
};
let currentMode = 'pomodoro';

// Sayfa yüklendiğinde localStorage'dan todos'ları yükle
document.addEventListener('DOMContentLoaded', () => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
        renderTodos();
    }

    // Tarih seçici başlat
    flatpickr("#dueDate", {
        dateFormat: "Y-m-d",
        minDate: "today"
    });

    // Tema ayarını yükle
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        document.body.classList.toggle('dark-theme', currentTheme === 'dark');
    }

    updateStats();

    // Mevcut DOMContentLoaded event listener'ın içine ekleyin
    timeLeft = timerModes[currentMode];
    updateTimerDisplay();

    // Bildirim izni iste
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
});

function addTodo() {
    const todoInput = document.getElementById('todoInput');
    const categorySelect = document.getElementById('categorySelect');
    const dueDateInput = document.getElementById('dueDate');
    const prioritySelect = document.getElementById('priority');
    const tagsInput = document.getElementById('tags');
    
    if (todoInput.value.trim() === '') {
        alert('Lütfen bir görev yazın!');
        return;
    }

    const tags = tagsInput.value
        .split('#')
        .filter(tag => tag.trim() !== '')
        .map(tag => tag.trim());

    const todo = {
        id: Date.now(),
        text: todoInput.value,
        completed: false,
        category: categorySelect.value,
        dueDate: dueDateInput.value,
        priority: prioritySelect.value,
        tags: tags,
        createdAt: new Date().toISOString()
    };

    todos.push(todo);
    saveTodos();
    renderTodos();
    updateStats();

    // Input alanlarını temizle
    todoInput.value = '';
    dueDateInput.value = '';
    tagsInput.value = '';
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
    updateStats();
}

function toggleComplete(id) {
    const todo = todos.find(todo => todo.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
        updateStats();
    }
}

function editTodo(id) {
    const todo = todos.find(todo => todo.id === id);
    if (todo) {
        const newText = prompt('Görevi düzenleyin:', todo.text);
        if (newText !== null && newText.trim() !== '') {
            todo.text = newText;
            saveTodos();
            renderTodos();
        }
    }
}

function searchTodos() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    renderTodos(searchText);
}

function sortTodos() {
    const sortBy = document.getElementById('sortSelect').value;
    
    todos.sort((a, b) => {
        switch(sortBy) {
            case 'date':
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'priority':
                const priorityOrder = { 'yüksek': 3, 'orta': 2, 'düşük': 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            case 'alpha':
                return a.text.localeCompare(b.text);
            default:
                return 0;
        }
    });

    renderTodos();
}

function filterTodos(filterType) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    renderTodos('', filterType);
}

function createTodoElement(todo) {
    const li = document.createElement('li');
    li.dataset.category = todo.category;
    li.dataset.priority = todo.priority;
    if (todo.completed) li.classList.add('completed');
    
    const dueDate = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'Tarih yok';
    const tags = todo.tags ? todo.tags.map(tag => `<span class="tag">#${tag}</span>`).join('') : '';
    
    li.innerHTML = `
        <div class="todo-content">
            ${todo.text}
            <div class="todo-info">
                ${dueDate} | ${todo.priority} öncelik
                <div class="tags">${tags}</div>
            </div>
        </div>
        <div class="todo-actions">
            <button class="complete-btn" onclick="toggleComplete(${todo.id})">
                ${todo.completed ? 'Geri Al' : 'Tamamla'}
            </button>
            <button class="edit-btn" onclick="editTodo(${todo.id})">Düzenle</button>
            <button class="delete-btn" onclick="deleteTodo(${todo.id})">Sil</button>
        </div>
    `;
    
    return li;
}

function renderTodos(searchText = '', filterType = 'all') {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';

    let filteredTodos = [...todos];

    // Arama filtresi
    if (searchText) {
        filteredTodos = filteredTodos.filter(todo => 
            todo.text.toLowerCase().includes(searchText) ||
            todo.tags.some(tag => tag.toLowerCase().includes(searchText))
        );
    }

    // Durum filtresi
    if (filterType === 'active') {
        filteredTodos = filteredTodos.filter(todo => !todo.completed);
    } else if (filterType === 'completed') {
        filteredTodos = filteredTodos.filter(todo => todo.completed);
    }

    filteredTodos.forEach(todo => {
        const li = createTodoElement(todo);
        todoList.appendChild(li);
    });
}

function updateStats() {
    const totalTasks = todos.length;
    const completedTasks = todos.filter(todo => todo.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', currentTheme);
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Enter tuşuna basıldığında görev ekleme
document.getElementById('todoInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTodo();
    }
});

function startPomodoro() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        document.getElementById('startTimer').disabled = true;
        document.getElementById('pauseTimer').disabled = false;
        
        timerId = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                notifyTimerComplete();
                resetPomodoro();
            }
        }, 1000);
    }
}

function pausePomodoro() {
    clearInterval(timerId);
    isTimerRunning = false;
    document.getElementById('startTimer').disabled = false;
    document.getElementById('pauseTimer').disabled = true;
}

function resetPomodoro() {
    clearInterval(timerId);
    isTimerRunning = false;
    timeLeft = timerModes[currentMode];
    updateTimerDisplay();
    document.getElementById('startTimer').disabled = false;
    document.getElementById('pauseTimer').disabled = true;
}

function setTimerMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.timer-mode button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    resetPomodoro();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

function notifyTimerComplete() {
    if (Notification.permission === 'granted') {
        new Notification('Pomodoro Tamamlandı!', {
            body: currentMode === 'pomodoro' ? 'Mola zamanı!' : 'Çalışma zamanı!',
            icon: '/favicon.ico'
        });
    }
    
    // Ses çal
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play();
} 