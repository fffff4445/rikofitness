// Инициализация
const tg = window.Telegram.WebApp;
tg.expand();

// База тренировок
const workoutsDB = {
    mixed: {
        name: "Совмещённая",
        exercises: [
            { name: "Берпи", sets: 3, reps: 10, duration: 45 },
            { name: "Прыжки", sets: 3, reps: 15, duration: 30 }
        ]
    },
    strength: {
        name: "Силовая",
        exercises: [
            { name: "Приседания", sets: 3, reps: 12, duration: 40 },
            { name: "Отжимания", sets: 3, reps: 10, duration: 45 }
        ]
    },
    cardio: {
        name: "Кардио",
        exercises: [
            { name: "Бег на месте", sets: 1, duration: 300 },
            { name: "Прыжки", sets: 1, duration: 180 }
        ]
    },
    walking: {
        name: "Ходьба",
        exercises: [
            { name: "Ходьба", sets: 1, duration: 1800 }
        ]
    },
    cycling: {
        name: "Велоезда",
        exercises: [
            { name: "Велосипед", sets: 1, duration: 1200 }
        ]
    }
};

// Данные пользователя
let userData = {
    isFirstTime: true,
    name: "",
    height: null,
    weight: null,
    birthdate: null,
    workoutsCompleted: 0,
    level: "beginner"
};

let currentWorkout = {
    type: null,
    exercises: [],
    currentExercise: 0,
    timer: null,
    timeLeft: 0,
    isTimerRunning: false
};

// DOM элементы
const elements = {
    profileHeader: document.getElementById('profile-header'),
    userName: document.getElementById('user-name'),
    userStatus: document.getElementById('user-status'),
    userAvatar: document.getElementById('user-avatar'),
    
    // Анкета
    onboardingView: document.getElementById('onboarding-view'),
    inputHeight: document.getElementById('input-height'),
    inputWeight: document.getElementById('input-weight'),
    inputBirthdate: document.getElementById('input-birthdate'),
    saveProfileBtn: document.getElementById('save-profile-btn'),
    
    // Главный экран
    mainView: document.getElementById('main-view'),
    startWorkoutBtn: document.getElementById('start-workout-btn'),
    workoutCount: document.getElementById('workout-count'),
    
    // Выбор тренировки
    workoutSelectionView: document.getElementById('workout-selection-view'),
    
    // Тренировка
    workoutScreenView: document.getElementById('workout-screen-view'),
    currentExercise: document.getElementById('current-exercise'),
    exerciseTimer: document.getElementById('exercise-timer'),
    exerciseTarget: document.getElementById('exercise-target'),
    completedReps: document.getElementById('completed-reps'),
    startTimerBtn: document.getElementById('start-timer-btn'),
    completeExerciseBtn: document.getElementById('complete-exercise-btn'),
    
    // Профиль
    profileModal: document.getElementById('profile-modal'),
    profileAge: document.getElementById('profile-age'),
    profileHeight: document.getElementById('profile-height'),
    profileWeight: document.getElementById('profile-weight'),
    profileWorkouts: document.getElementById('profile-workouts'),
    editProfileBtn: document.getElementById('edit-profile-btn'),
    closeProfileBtn: document.getElementById('close-profile-btn')
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
        userData.isFirstTime = !userData.height || !userData.weight || !userData.birthdate;
    }
    
    // Данные из Telegram
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
    // Имя
    elements.userName.textContent = userData.name || "Пользователь";
    
    // Возраст в скобках
    if (userData.birthdate) {
        const age = calculateAge(userData.birthdate);
        elements.userName.innerHTML = `${userData.name} <span class="age-badge">${age}</span>`;
    }
    
    // Статус
    updateStatus();
    
    // Количество тренировок
    elements.workoutCount.textContent = `Тренировок: ${userData.workoutsCompleted || 0}`;
}

// Расчет возраста
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

// Обновление статуса
function updateStatus() {
    let status = "Новичок";
    if (userData.workoutsCompleted >= 10) status = "Любитель";
    if (userData.workoutsCompleted >= 30) status = "Опытный";
    if (userData.workoutsCompleted >= 50) status = "Профи";
    
    elements.userStatus.textContent = `Статус: ${status}`;
}

// Обработчики событий
function setupEventListeners() {
    // Сохранение профиля
    elements.saveProfileBtn.addEventListener('click', saveProfile);
    
    // Профиль
    elements.profileHeader.addEventListener('click', showProfileModal);
    elements.closeProfileBtn.addEventListener('click', hideProfileModal);
    elements.editProfileBtn.addEventListener('click', editProfile);
    
    // Навигация
    elements.startWorkoutBtn.addEventListener('click', showWorkoutSelection);
    document.getElementById('back-to-main-btn').addEventListener('click', showMainView);
    
    // Выбор тренировки
    document.querySelectorAll('.workout-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            startWorkout(type);
        });
    });
    
    // Тренировка
    elements.startTimerBtn.addEventListener('click', toggleTimer);
    elements.completeExerciseBtn.addEventListener('click', completeExercise);
    document.getElementById('increase-reps').addEventListener('click', () => changeReps(1));
    document.getElementById('decrease-reps').addEventListener('click', () => changeReps(-1));
}

function saveProfile() {
    userData.height = parseInt(elements.inputHeight.value);
    userData.weight = parseInt(elements.inputWeight.value);
    userData.birthdate = elements.inputBirthdate.value;
    
    if (!userData.height || !userData.weight || !userData.birthdate) {
        tg.showAlert("Заполните все поля правильно!");
        return;
    }
    
    userData.isFirstTime = false;
    saveUserData();
    updateUI();
    showMainView();
    tg.showAlert("Профиль сохранен!");
}

function showProfileModal() {
    if (!userData.height) return;
    
    elements.profileHeight.textContent = userData.height;
    elements.profileWeight.textContent = userData.weight;
    elements.profileWorkouts.textContent = userData.workoutsCompleted;
    
    if (userData.birthdate) {
        elements.profileAge.textContent = calculateAge(userData.birthdate);
    }
    
    elements.profileModal.style.display = 'flex';
}

function hideProfileModal() {
    elements.profileModal.style.display = 'none';
}

function editProfile() {
    hideProfileModal();
    showOnboarding();
    elements.inputHeight.value = userData.height;
    elements.inputWeight.value = userData.weight;
    elements.inputBirthdate.value = userData.birthdate;
}

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

function startWorkout(type) {
    currentWorkout = {
        type,
        exercises: [...workoutsDB[type].exercises],
        currentExercise: 0,
        timer: null,
        timeLeft: 0,
        isTimerRunning: false
    };
    
    showExercise();
}

function showExercise() {
    if (currentWorkout.currentExercise >= currentWorkout.exercises.length) {
        finishWorkout();
        return;
    }
    
    const exercise = currentWorkout.exercises[currentWorkout.currentExercise];
    elements.currentExercise.textContent = exercise.name;
    
    if (exercise.reps) {
        elements.exerciseTarget.textContent = `Подходы: ${exercise.sets} × ${exercise.reps} повт.`;
        elements.completedReps.textContent = exercise.reps;
    } else {
        elements.exerciseTarget.textContent = `Длительность: ${formatTime(exercise.duration)}`;
        elements.completedReps.textContent = "0";
    }
    
    currentWorkout.timeLeft = exercise.duration || 30;
    elements.exerciseTimer.textContent = formatTime(currentWorkout.timeLeft);
    elements.startTimerBtn.textContent = "▶️ Запустить";
    currentWorkout.isTimerRunning = false;
    
    hideAllViews();
    elements.workoutScreenView.style.display = 'block';
}

function toggleTimer() {
    if (currentWorkout.isTimerRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (currentWorkout.timer) clearInterval(currentWorkout.timer);
    
    currentWorkout.isTimerRunning = true;
    elements.startTimerBtn.textContent = "⏸ Пауза";
    
    currentWorkout.timer = setInterval(() => {
        currentWorkout.timeLeft--;
        elements.exerciseTimer.textContent = formatTime(currentWorkout.timeLeft);
        
        if (currentWorkout.timeLeft <= 0) {
            clearInterval(currentWorkout.timer);
            currentWorkout.isTimerRunning = false;
            elements.startTimerBtn.textContent = "✅ Готово";
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(currentWorkout.timer);
    currentWorkout.isTimerRunning = false;
    elements.startTimerBtn.textContent = "▶️ Продолжить";
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

function changeReps(change) {
    const reps = parseInt(elements.completedReps.textContent) + change;
    if (reps >= 0) elements.completedReps.textContent = reps;
}

function completeExercise() {
    if (currentWorkout.timer) {
        clearInterval(currentWorkout.timer);
    }
    
    currentWorkout.currentExercise++;
    showExercise();
}

function finishWorkout() {
    userData.workoutsCompleted++;
    saveUserData();
    updateUI();
    showMainView();
    tg.showAlert(`Тренировка "${workoutsDB[currentWorkout.type].name}" завершена! 🎉`);
}

function hideAllViews() {
    document.querySelectorAll('section').forEach(view => {
        view.style.display = 'none';
    });
}

// Запуск
document.addEventListener('DOMContentLoaded', initApp);
