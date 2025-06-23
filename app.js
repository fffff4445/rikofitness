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
    level: "beginner",
    equipment: false,
    streak: 0,
    totalWorkouts: 0,
    lastWorkout: null,
    workoutHistory: []
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
            // ... другие упражнения
        ],
        advanced: [
            // ... продвинутые упражнения
        ]
    },
    // ... другие типы тренировок
};

// Текущая сессия
let currentWorkout = {
    type: null,
    level: null,
    exercises: [],
    currentExercise: 0,
    startTime: null
};

// DOM элементы
const elements = {
    onboardingView: document.getElementById('onboarding-view'),
    mainView: document.getElementById('main-view'),
    workoutTypeView: document.getElementById('workout-type-view'),
    workoutLevelView: document.getElementById('workout-level-view'),
    workoutProgressView: document.getElementById('workout-progress-view'),
    progressView: document.getElementById('progress-view'),
    // ... остальные элементы
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
        updateProfileUI();
    }
    
    // Загрузка профиля Telegram
    if (tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userData.name = `${user.first_name} ${user.last_name || ''}`.trim();
        
        if (user.photo_url) {
            document.getElementById('user-avatar').style.backgroundImage = 
                `url(${user.photo_url})`;
        }
    }
}

// Сохранение данных
function saveUserData() {
    localStorage.setItem('rikoFitnessData', JSON.stringify(userData));
}

// Обновление UI профиля
function updateProfileUI() {
    document.getElementById('user-name').textContent = userData.name || "Пользователь";
    
    if (userData.age && userData.height && userData.weight) {
        document.getElementById('user-stats').textContent = 
            `${userData.age} лет • ${userData.height}см • ${userData.weight}кг`;
    }
    
    document.getElementById('streak-days').textContent = 
        `${userData.streak} ${pluralize(userData.streak, ['день', 'дня', 'дней'])}`;
}

// Показ анкеты
function showOnboarding() {
    elements.onboardingView.style.display = 'block';
    elements.mainView.style.display = 'none';
    // ... скрыть другие view
}

// Начало тренировки
function startWorkout(type, level) {
    currentWorkout = {
        type,
        level,
        exercises: getExercisesForWorkout(type, level),
        currentExercise: 0,
        startTime: new Date()
    };
    
    showExercise(currentWorkout.currentExercise);
}

// Таймер упражнения
function startExerciseTimer(duration, onComplete) {
    let timeLeft = duration;
    const timerElement = document.getElementById('exercise-timer');
    
    const timer = setInterval(() => {
        timeLeft--;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.querySelector('span').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            onComplete();
        }
    }, 1000);
    
    return timer;
}

// Завершение тренировки
function completeWorkout() {
    userData.totalWorkouts++;
    userData.streak++;
    userData.lastWorkout = new Date().toISOString();
    saveUserData();
    
    tg.showAlert("Тренировка завершена! 🎉");
    showMainView();
}

// Вспомогательные функции
function pluralize(number, words) {
    // ... реализация склонения
}

function getExercisesForWorkout(type, level) {
    // ... фильтрация упражнений по уровню и снаряжению
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);
