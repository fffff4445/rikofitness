// Инициализация
const tg = window.Telegram.WebApp;
tg.expand();

// Данные
let userData = {
    isFirstTime: true,
    name: "",
    age: null,
    height: null,
    weight: null,
    birthdate: null,
    equipment: false,
    streak: 0
};

let currentWorkout = {
    type: null,
    exercises: [
        { name: "Приседания", sets: 3, reps: 12, duration: 30 },
        { name: "Отжимания", sets: 3, reps: 10, duration: 45 }
    ],
    currentExercise: 0,
    timer: null
};

// DOM элементы
const elements = {
    // Профиль
    userName: document.getElementById('user-name'),
    userStats: document.getElementById('user-stats'),
    userAvatar: document.getElementById('user-avatar'),
    
    // Анкета
    onboardingView: document.getElementById('onboarding-view'),
    inputAge: document.getElementById('input-age'),
    inputHeight: document.getElementById('input-height'),
    inputWeight: document.getElementById('input-weight'),
    inputBirthdate: document.getElementById('input-birthdate'),
    saveProfileBtn: document.getElementById('save-profile-btn'),
    
    // Главный экран
    mainView: document.getElementById('main-view'),
    startWorkoutBtn: document.getElementById('start-workout-btn'),
    streakDays: document.getElementById('streak-days'),
    
    // Тренировка
    workoutSelectionView: document.getElementById('workout-selection-view'),
    workoutScreenView: document.getElementById('workout-screen-view'),
    currentExercise: document.getElementById('current-exercise'),
    exerciseTimer: document.getElementById('exercise-timer'),
    exerciseTarget: document.getElementById('exercise-target'),
    completedReps: document.getElementById('completed-reps'),
    completeExerciseBtn: document.getElementById('complete-exercise-btn')
};

// Инициализация
function initApp() {
    loadUserData();
    setupEventListeners();
    
    if (userData.isFirstTime) {
        showOnboarding();
    } else {
        showMainView();
    }
}

// Загрузка данных
function loadUserData() {
    const savedData = localStorage.getItem('rikoFitnessData');
    if (savedData) {
        userData = JSON.parse(savedData);
    }
    
    if (tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userData.name = `${user.first_name} ${user.last_name || ''}`.trim();
        if (user.photo_url) {
            elements.userAvatar.style.backgroundImage = `url(${user.photo_url})`;
        }
    }
    
    updateUI();
}

// Сохранение данных
function saveUserData() {
    localStorage.setItem('rikoFitnessData', JSON.stringify(userData));
}

// Обновление интерфейса
function updateUI() {
    elements.userName.textContent = userData.name || "Пользователь";
    
    if (userData.age && userData.height && userData.weight) {
        elements.userStats.textContent = 
            `${userData.age} лет • ${userData.height}см • ${userData.weight}кг`;
    } else {
        elements.userStats.textContent = "Не заполнено";
    }
    
    elements.streakDays.textContent = `Тренировок: ${userData.streak}`;
}

// Обработчики событий
function setupEventListeners() {
    // Сохранение профиля
    elements.saveProfileBtn.addEventListener('click', () => {
        const age = parseInt(elements.inputAge.value);
        const height = parseInt(elements.inputHeight.value);
        const weight = parseInt(elements.inputWeight.value);
        const birthdate = elements.inputBirthdate.value;
        
        if (!age || !height || !weight || !birthdate) {
            tg.showAlert("Заполните все поля!");
            return;
        }
        
        userData = {
            ...userData,
            age,
            height,
            weight,
            birthdate,
            isFirstTime: false
        };
        
        saveUserData();
        updateUI();
        showMainView();
        tg.showAlert("Профиль сохранен!");
    });
    
    // Навигация
    elements.startWorkoutBtn.addEventListener('click', () => {
        showWorkoutSelection();
    });
    
    document.getElementById('back-to-main-btn').addEventListener('click', showMainView);
    
    // Тренировка
    document.querySelectorAll('.workout-card').forEach(card => {
        card.addEventListener('click', (e) => {
            userData.equipment = document.getElementById('has-equipment').checked;
            startWorkout(e.currentTarget.dataset.type);
        });
    });
    
    elements.completeExerciseBtn.addEventListener('click', completeExercise);
    document.getElementById('increase-reps').addEventListener('click', () => {
        elements.completedReps.textContent = parseInt(elements.completedReps.textContent) + 1;
    });
    document.getElementById('decrease-reps').addEventListener('click', () => {
        const reps = parseInt(elements.completedReps.textContent);
        if (reps > 0) elements.completedReps.textContent = reps - 1;
    });
}

// Тренировка
function startWorkout(type) {
    currentWorkout.type = type;
    currentWorkout.currentExercise = 0;
    showExercise();
}

function showExercise() {
    const exercise = currentWorkout.exercises[currentWorkout.currentExercise];
    elements.currentExercise.textContent = exercise.name;
    elements.exerciseTarget.textContent = `${exercise.sets}×${exercise.reps}`;
    elements.completedReps.textContent = exercise.reps;
    
    startTimer(exercise.duration);
    showWorkoutScreen();
}

function startTimer(seconds) {
    if (currentWorkout.timer) clearInterval(currentWorkout.timer);
    
    let timeLeft = seconds;
    updateTimer(timeLeft);
    
    currentWorkout.timer = setInterval(() => {
        timeLeft--;
        updateTimer(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(currentWorkout.timer);
        }
    }, 1000);
}

function updateTimer(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    elements.exerciseTimer.textContent = `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

function completeExercise() {
    if (currentWorkout.timer) clearInterval(currentWorkout.timer);
    
    currentWorkout.currentExercise++;
    if (currentWorkout.currentExercise < currentWorkout.exercises.length) {
        showExercise();
    } else {
        finishWorkout();
    }
}

function finishWorkout() {
    userData.streak++;
    saveUserData();
    showMainView();
    tg.showAlert("Тренировка завершена! 🎉");
}

// Навигация
function showOnboarding() {
    hideAllViews();
    elements.onboardingView.style.display = 'block';
    
    // Установка максимальной даты (14+ лет)
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
    elements.inputBirthdate.max = maxDate.toISOString().split('T')[0];
}

function showMainView() {
    hideAllViews();
    elements.mainView.style.display = 'block';
    updateUI();
}

function showWorkoutSelection() {
    hideAllViews();
    elements.workoutSelectionView.style.display = 'block';
}

function showWorkoutScreen() {
    hideAllViews();
    elements.workoutScreenView.style.display = 'block';
}

function hideAllViews() {
    document.querySelectorAll('section').forEach(view => {
        view.style.display = 'none';
    });
}

// Запуск
document.addEventListener('DOMContentLoaded', initApp);
