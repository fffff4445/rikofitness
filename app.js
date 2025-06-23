// Инициализация
const tg = window.Telegram.WebApp;
tg.expand();

// Данные
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
    exercises: [
        { name: "Приседания", sets: 3, reps: 12, duration: 30 },
        { name: "Отжимания", sets: 3, reps: 10, duration: 45 }
    ],
    currentExercise: 0,
    timer: null
};

// DOM элементы
const elements = {
    profileHeader: document.getElementById('profile-header'),
    userName: document.getElementById('user-name'),
    userAge: document.getElementById('user-age'),
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
    
    // Модалка профиля
    profileModal: document.getElementById('profile-modal'),
    profileHeight: document.getElementById('profile-height'),
    profileWeight: document.getElementById('profile-weight'),
    profileBirthdate: document.getElementById('profile-birthdate'),
    profileWorkouts: document.getElementById('profile-workouts'),
    editProfileBtn: document.getElementById('edit-profile-btn'),
    closeProfileBtn: document.getElementById('close-profile-btn'),
    
    // Тренировка
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
    // Имя и возраст
    elements.userName.textContent = userData.name;
    if (userData.birthdate) {
        const age = calculateAge(userData.birthdate);
        elements.userAge.textContent = `(${age})`;
    }
    
    // Статус
    let status = "Новичок";
    if (userData.workoutsCompleted >= 20) status = "Опытный";
    if (userData.workoutsCompleted >= 50) status = "Профи";
    elements.userStatus.textContent = `Статус: ${status}`;
    
    // Прогресс
    elements.workoutCount.textContent = `Тренировок: ${userData.workoutsCompleted}`;
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

// Обработчики событий
function setupEventListeners() {
    // Сохранение профиля
    elements.saveProfileBtn.addEventListener('click', saveProfile);
    
    // Открытие профиля
    elements.profileHeader.addEventListener('click', showProfileModal);
    elements.closeProfileBtn.addEventListener('click', hideProfileModal);
    elements.editProfileBtn.addEventListener('click', editProfile);
    
    // Тренировка
    elements.startWorkoutBtn.addEventListener('click', startWorkout);
    elements.completeExerciseBtn.addEventListener('click', completeExercise);
    document.getElementById('increase-reps').addEventListener('click', () => changeReps(1));
    document.getElementById('decrease-reps').addEventListener('click', () => changeReps(-1));
}

function saveProfile() {
    userData.height = parseInt(elements.inputHeight.value);
    userData.weight = parseInt(elements.inputWeight.value);
    userData.birthdate = elements.inputBirthdate.value;
    
    if (!userData.height || !userData.weight || !userData.birthdate) {
        tg.showAlert("Заполните все поля!");
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
    elements.profileBirthdate.textContent = new Date(userData.birthdate).toLocaleDateString();
    elements.profileWorkouts.textContent = userData.workoutsCompleted;
    
    elements.profileModal.style.display = 'block';
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

function startWorkout() {
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

function changeReps(change) {
    const reps = parseInt(elements.completedReps.textContent) + change;
    if (reps >= 0) elements.completedReps.textContent = reps;
}

function completeExercise() {
    clearInterval(currentWorkout.timer);
    
    currentWorkout.currentExercise++;
    if (currentWorkout.currentExercise < currentWorkout.exercises.length) {
        showExercise();
    } else {
        finishWorkout();
    }
}

function finishWorkout() {
    userData.workoutsCompleted++;
    saveUserData();
    updateUI();
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
