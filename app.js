// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Данные пользователя
let userData = {
    streak: 0,
    totalWorkouts: 0,
    lastWorkout: null,
    workoutHistory: []
};

// Загрузка данных упражнений
let exercises = {};

fetch('exercises.json')
    .then(response => response.json())
    .then(data => {
        exercises = data;
        initApp();
    })
    .catch(error => {
        console.error('Error loading exercises:', error);
    });

// Инициализация приложения
function initApp() {
    // Загружаем данные пользователя (в реальном приложении - с сервера)
    loadUserData();
    
    // Устанавливаем имя пользователя
    const userInitial = tg.initDataUnsafe.user?.first_name?.charAt(0) || 'U';
    document.getElementById('user-info').textContent = userInitial;
    
    // Навигация
    document.getElementById('start-workout-btn').addEventListener('click', () => {
        document.getElementById('main-view').style.display = 'none';
        document.getElementById('workout-view').style.display = 'block';
    });
    
    document.getElementById('view-progress-btn').addEventListener('click', showProgressView);
    
    document.getElementById('back-to-main-btn').addEventListener('click', showMainView);
    document.getElementById('back-to-main-btn-2').addEventListener('click', showMainView);
    
    // Выбор тренировки
    document.querySelectorAll('.workout-card').forEach(card => {
        card.addEventListener('click', function() {
            const level = this.getAttribute('data-level');
            startWorkout(level);
        });
    });
    
    // Завершение тренировки
    document.getElementById('complete-workout-btn').addEventListener('click', completeWorkout);
}

function loadUserData() {
    // В реальном приложении загружаем с сервера
    const savedData = localStorage.getItem('fitnessUserData');
    if (savedData) {
        userData = JSON.parse(savedData);
    }
    
    updateUI();
}

function saveUserData() {
    localStorage.setItem('fitnessUserData', JSON.stringify(userData));
    updateUI();
}

function updateUI() {
    document.getElementById('streak-days').textContent = `${userData.streak} ${pluralize(userData.streak, ['день', 'дня', 'дней'])}`;
    document.getElementById('total-workouts').textContent = userData.totalWorkouts;
    
    // Для страницы прогресса
    document.getElementById('progress-streak').textContent = `${userData.streak} ${pluralize(userData.streak, ['день', 'дня', 'дней'])}`;
    document.getElementById('progress-total').textContent = userData.totalWorkouts;
    document.getElementById('last-workout').textContent = userData.lastWorkout ? 
        new Date(userData.lastWorkout).toLocaleDateString() : 'Никогда';
    
    // Обновляем график прогресса
    updateProgressChart();
}

function pluralize(number, words) {
    const cases = [2, 0, 1, 1, 1, 2];
    return words[
        number % 100 > 4 && number % 100 < 20 ? 2 : cases[Math.min(number % 10, 5)]
    ];
}

function showMainView() {
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('workout-view').style.display = 'none';
    document.getElementById('workout-progress-view').style.display = 'none';
    document.getElementById('progress-view').style.display = 'none';
}

function showProgressView() {
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('progress-view').style.display = 'block';
    updateProgressChart();
}

function startWorkout(level) {
    document.getElementById('workout-view').style.display = 'none';
    document.getElementById('workout-progress-view').style.display = 'block';
    
    const workoutTitle = level === 'beginner' ? 'Тренировка для начинающих' : 'Продвинутая тренировка';
    document.getElementById('workout-title').textContent = workoutTitle;
    
    const exerciseContainer = document.getElementById('exercise-container');
    exerciseContainer.innerHTML = '';
    
    const workoutExercises = exercises[level];
    workoutExercises.forEach(exercise => {
        const exerciseEl = document.createElement('div');
        exerciseEl.className = 'exercise-item';
        exerciseEl.innerHTML = `
            <div class="exercise-info">
                <h4>${exercise.name}</h4>
                <p>${exercise.sets} подхода × ${exercise.reps || exercise.duration}</p>
            </div>
            <div class="exercise-status">◯</div>
        `;
        exerciseContainer.appendChild(exerciseEl);
    });
}

function completeWorkout() {
    // Обновляем данные пользователя
    userData.totalWorkouts += 1;
    userData.streak += 1;
    userData.lastWorkout = new Date().toISOString();
    userData.workoutHistory.push({
        date: new Date().toISOString(),
        type: document.getElementById('workout-title').textContent
    });
    
    saveUserData();
    
    // Показываем уведомление
    tg.showAlert('Отличная работа! Тренировка завершена.');
    
    // Возвращаемся на главный экран
    showMainView();
}

function updateProgressChart() {
    const ctx = document.getElementById('progress-chart').getContext('2d');
    
    // В реальном приложении используем библиотеку Chart.js
    // Здесь просто пример:
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Простая визуализация
    ctx.fillStyle = '#6C63FF';
    const maxHeight = 100;
    const width = 30;
    const gap = 10;
    
    // Ограничим историю 7 последними тренировками
    const recentWorkouts = userData.workoutHistory.slice(-7);
    
    recentWorkouts.forEach((workout, i) => {
        const height = 20 + (i * 10);
        ctx.fillRect(i * (width + gap), maxHeight - height, width, height);
    });
}