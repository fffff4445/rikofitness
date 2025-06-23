// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Данные пользователя
let userData = {
    isFirstTime: true,
    name: "",
    age: null,
    height: null,
    weight: null,
    birthdate: null,
    level: "beginner",
    equipment: false,
    streak: 0,
    totalWorkouts: 0,
    lastWorkout: null,
    workoutHistory: []
};

// Текущая тренировка
let currentWorkout = {
    type: null,
    level: null,
    exercises: [],
    currentExercise: 0,
    startTime: null,
    timer: null
};

// DOM элементы
const elements = {
    // Профиль
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    userStats: document.getElementById('user-stats'),
    
    // Анкета
    onboardingView: document.getElementById('onboarding-view'),
    inputAge: document.getElementById('input-age'),
    inputHeight: document.getElementById('input-height'),
    inputWeight: document.getElementById('input-weight'),
    inputBirthdate: document.getElementById('input-birthdate'),
    saveProfileBtn: document.getElementById('save-profile-btn'),
    
    // Основные view
    mainView: document.getElementById('main-view'),
    workoutTypeView: document.getElementById('workout-type-view'),
    workoutLevelView: document.getElementById('workout-level-view'),
    workoutProgressView: document.getElementById('workout-progress-view'),
    progressView: document.getElementById('progress-view'),
    
    // Тренировка
    workoutTitle: document.getElementById('workout-title'),
    workoutProgress: document.getElementById('workout-progress'),
    currentExerciseName: document.getElementById('current-exercise-name'),
    exerciseTimer: document.getElementById('exercise-timer'),
    exerciseTarget: document.getElementById('exercise-target'),
    completedReps: document.getElementById('completed-reps'),
    targetReps: document.getElementById('target-reps'),
    decreaseRepsBtn: document.getElementById('decrease-reps'),
    increaseRepsBtn: document.getElementById('increase-reps'),
    nextExerciseBtn: document.getElementById('next-exercise-btn'),
    
    // Прогресс
    streakDays: document.getElementById('streak-days'),
    caloriesBurned: document.getElementById('calories-burned'),
    progressStreak: document.getElementById('progress-streak'),
    progressTotal: document.getElementById('progress-total'),
    lastWorkout: document.getElementById('last-workout'),
    avgActivity: document.getElementById('avg-activity')
};

// База упражнений
const exercisesDB = {
    strength: {
        beginner: [
            {
                name: "Приседания",
                sets: 3,
                reps: 12,
                duration: 30,
                desc: "Держите спину прямо",
                equipment: false
            },
            {
                name: "Отжимания",
                sets: 3,
                reps: 8,
                duration: 45,
                desc: "Локти под углом 45°",
                equipment: false
            }
        ],
        advanced: [
            {
                name: "Приседания с прыжком",
                sets: 4,
                reps: 15,
                duration: 40,
                desc: "Взрывное движение вверх",
                equipment: false
            }
        ]
    },
    cardio: {
        beginner: [
            {
                name: "Бег на месте",
                sets: 1,
                duration: 180,
                desc: "Высоко поднимайте колени",
                equipment: false
            }
        ]
    },
    mixed: {
        beginner: [
            {
                name: "Берпи",
                sets: 3,
                reps: 10,
                duration: 45,
                desc: "Присед → упор лёжа → прыжок",
                equipment: false
            }
        ]
    }
};

// Инициализация приложения
function initApp() {
    loadUserData();
    setupEventListeners();
    
    if (userData.isFirstTime) {
        showOnboarding();
    } else {
        showMainView();
    }
}

// Загрузка данных пользователя
function loadUserData() {
    const savedData = localStorage.getItem('rikoFitnessData');
    if (savedData) {
        userData = JSON.parse(savedData);
        // Проверяем, заполнены ли все обязательные поля
        userData.isFirstTime = !(userData.age && userData.height && userData.weight && userData.birthdate);
        updateProfileUI();
    }
    
    // Загрузка профиля Telegram
    if (tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userData.name = `${user.first_name} ${user.last_name || ''}`.trim();
        elements.userName.textContent = userData.name;
        
        if (user.photo_url) {
            elements.userAvatar.style.backgroundImage = `url(${user.photo_url})`;
        }
    }
}

// Сохранение данных
function saveUserData() {
    localStorage.setItem('rikoFitnessData', JSON.stringify(userData));
}

// Обновление UI профиля
function updateProfileUI() {
    if (userData.name) {
        elements.userName.textContent = userData.name;
    } else {
        elements.userName.textContent = "Пользователь";
    }
    
    if (userData.age && userData.height && userData.weight && userData.birthdate) {
        const age = calculateAge(userData.birthdate);
        elements.userStats.textContent = `${age} лет • ${userData.height}см • ${userData.weight}кг`;
    } else {
        elements.userStats.textContent = "Не заполнено";
    }
    
    // Обновляем статистику
    elements.streakDays.textContent = `${userData.streak} ${pluralize(userData.streak, ['день', 'дня', 'дней'])}`;
    elements.progressStreak.textContent = `${userData.streak} ${pluralize(userData.streak, ['день', 'дня', 'дней'])}`;
    elements.progressTotal.textContent = userData.totalWorkouts;
    
    if (userData.lastWorkout) {
        const lastWorkoutDate = new Date(userData.lastWorkout);
        elements.lastWorkout.textContent = lastWorkoutDate.toLocaleDateString();
    } else {
        elements.lastWorkout.textContent = "Никогда";
    }
}

// Вычисление возраста из даты рождения
function calculateAge(birthdate) {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Склонение слов
function pluralize(number, words) {
    const cases = [2, 0, 1, 1, 1, 2];
    return words[
        number % 100 > 4 && number % 100 < 20 ? 2 : cases[Math.min(number % 10, 5)]
    ];
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Сохранение профиля
    elements.saveProfileBtn.addEventListener('click', saveProfile);
    
    // Навигация
    document.getElementById('start-workout-btn').addEventListener('click', showWorkoutTypeView);
    document.getElementById('view-progress-btn').addEventListener('click', showProgressView);
    
    // Кнопки назад
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (elements.workoutLevelView.style.display === 'block') {
                showWorkoutTypeView();
            } else if (elements.workoutTypeView.style.display === 'block') {
                showMainView();
            } else if (elements.progressView.style.display === 'block') {
                showMainView();
            }
        });
    });
    
    // Выбор типа тренировки
    document.querySelectorAll('.workout-card').forEach(card => {
        card.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            userData.equipment = document.getElementById('has-equipment').checked;
            showWorkoutLevelView(type);
        });
    });
    
    // Выбор уровня
    document.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', function() {
            const level = this.getAttribute('data-level');
            startWorkout(currentWorkout.type, level);
        });
    });
    
    // Управление тренировкой
    elements.decreaseRepsBtn.addEventListener('click', () => {
        const current = parseInt(elements.completedReps.textContent);
        if (current > 0) {
            elements.completedReps.textContent = current - 1;
        }
    });
    
    elements.increaseRepsBtn.addEventListener('click', () => {
        const current = parseInt(elements.completedReps.textContent);
        elements.completedReps.textContent = current + 1;
    });
    
    elements.nextExerciseBtn.addEventListener('click', nextExercise);
}

// Сохранение профиля
function saveProfile() {
    userData.age = elements.inputAge.value;
    userData.height = elements.inputHeight.value;
    userData.weight = elements.inputWeight.value;
    userData.birthdate = elements.inputBirthdate.value;
    
    if (userData.age && userData.height && userData.weight && userData.birthdate) {
        userData.isFirstTime = false;
        userData.age = calculateAge(userData.birthdate);
        saveUserData();
        updateProfileUI();
        showMainView();
    } else {
        tg.showAlert("Пожалуйста, заполните все поля!");
    }
}

// Показать анкету
function showOnboarding() {
    hideAllViews();
    elements.onboardingView.style.display = 'block';
    
    // Установить максимальную дату рождения (минимум 14 лет)
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
    elements.inputBirthdate.max = maxDate.toISOString().split('T')[0];
}

// Показать главный экран
function showMainView() {
    hideAllViews();
    elements.mainView.style.display = 'block';
    updateProfileUI();
}

// Показать выбор типа тренировки
function showWorkoutTypeView() {
    hideAllViews();
    elements.workoutTypeView.style.display = 'block';
}

// Показать выбор уровня
function showWorkoutLevelView(type) {
    hideAllViews();
    elements.workoutLevelView.style.display = 'block';
    currentWorkout.type = type;
}

// Показать прогресс
function showProgressView() {
    hideAllViews();
    elements.progressView.style.display = 'block';
    updateProgressChart();
}

// Начать тренировку
function startWorkout(type, level) {
    currentWorkout = {
        type,
        level,
        exercises: getExercisesForWorkout(type, level),
        currentExercise: 0,
        startTime: new Date(),
        timer: null
    };
    
    showExercise(currentWorkout.currentExercise);
}

// Получить упражнения для тренировки
function getExercisesForWorkout(type, level) {
    let exercises = exercisesDB[type][level];
    
    // Фильтруем по наличию снаряжения
    if (!userData.equipment) {
        exercises = exercises.filter(ex => !ex.equipment);
    }
    
    return exercises;
}

// Показать упражнение
function showExercise(index) {
    if (index >= currentWorkout.exercises.length) {
        completeWorkout();
        return;
    }
    
    hideAllViews();
    elements.workoutProgressView.style.display = 'block';
    
    const exercise = currentWorkout.exercises[index];
    elements.workoutTitle.textContent = `${currentWorkout.type === 'strength' ? '💪' : '🏃'} Тренировка`;
    elements.workoutProgress.textContent = `Упражнение ${index + 1}/${currentWorkout.exercises.length}`;
    elements.currentExerciseName.textContent = exercise.name;
    
    if (exercise.reps) {
        elements.exerciseTarget.textContent = `Цель: ${exercise.sets}×${exercise.reps} повт.`;
        elements.targetReps.textContent = exercise.reps;
        elements.completedReps.textContent = exercise.reps;
    } else {
        elements.exerciseTarget.textContent = `Цель: ${exercise.duration} сек.`;
    }
    
    // Запуск таймера
    if (currentWorkout.timer) {
        clearInterval(currentWorkout.timer);
    }
    
    const duration = exercise.duration || 30;
    startExerciseTimer(duration);
}

// Таймер упражнения
function startExerciseTimer(duration) {
    let timeLeft = duration;
    updateTimerDisplay(timeLeft);
    
    currentWorkout.timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(currentWorkout.timer);
            elements.nextExerciseBtn.textContent = "Продолжить";
        }
    }, 1000);
}

// Обновление отображения таймера
function updateTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    elements.exerciseTimer.querySelector('span').textContent = 
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Следующее упражнение
function nextExercise() {
    if (currentWorkout.timer) {
        clearInterval(currentWorkout.timer);
    }
    
    currentWorkout.currentExercise++;
    showExercise(currentWorkout.currentExercise);
}

// Завершение тренировки
function completeWorkout() {
    userData.totalWorkouts++;
    userData.streak++;
    userData.lastWorkout = new Date().toISOString();
    
    // Сохраняем статистику тренировки
    userData.workoutHistory.push({
        date: new Date(),
        type: currentWorkout.type,
        level: currentWorkout.level,
        duration: Math.floor((new Date() - currentWorkout.startTime) / 60000) // в минутах
    });
    
    saveUserData();
    tg.showAlert("Тренировка завершена! 🎉");
    showMainView();
}

// Обновление графика прогресса
function updateProgressChart() {
    const ctx = document.getElementById('progress-chart').getContext('2d');
    
    // Данные для графика (последние 7 тренировок)
    const workoutData = userData.workoutHistory.slice(-7).map(w => ({
        date: new Date(w.date).toLocaleDateString(),
        duration: w.duration
    }));
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: workoutData.map(w => w.date),
            datasets: [{
                label: 'Длительность (мин)',
                data: workoutData.map(w => w.duration),
                backgroundColor: '#6C63FF'
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Скрыть все view
function hideAllViews() {
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);
