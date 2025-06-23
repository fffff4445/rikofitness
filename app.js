// Инициализация Telegram WebApp
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
    streak: 0
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
    
    // Главный экран
    mainView: document.getElementById('main-view'),
    startWorkoutBtn: document.getElementById('start-workout-btn'),
    streakDays: document.getElementById('streak-days')
};

// Инициализация приложения
function initApp() {
    console.log("Приложение инициализировано");
    
    // Проверяем, запущено ли в Telegram
    if (!window.Telegram || !window.Telegram.WebApp) {
        alert("Запускайте приложение через Telegram!");
        return;
    }
    
    // Загружаем данные
    loadUserData();
    
    // Настройка обработчиков
    setupEventListeners();
    
    // Показываем нужный экран
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
        console.log("Данные загружены:", userData);
    }
    
    // Загружаем профиль из Telegram
    if (tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userData.name = `${user.first_name} ${user.last_name || ''}`.trim();
        
        if (user.photo_url) {
            elements.userAvatar.style.backgroundImage = `url(${user.photo_url})`;
        }
    }
    
    updateProfileUI();
}

// Сохранение данных
function saveUserData() {
    localStorage.setItem('rikoFitnessData', JSON.stringify(userData));
    console.log("Данные сохранены:", userData);
}

// Обновление интерфейса профиля
function updateProfileUI() {
    elements.userName.textContent = userData.name || "Пользователь";
    
    if (userData.age && userData.height && userData.weight) {
        elements.userStats.textContent = 
            `${userData.age} лет • ${userData.height}см • ${userData.weight}кг`;
    } else {
        elements.userStats.textContent = "Не заполнено";
    }
    
    if (userData.streak) {
        elements.streakDays.textContent = `Тренировок: ${userData.streak}`;
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка сохранения профиля
    elements.saveProfileBtn.addEventListener('click', saveProfile);
    
    // Кнопка начала тренировки
    elements.startWorkoutBtn.addEventListener('click', () => {
        tg.showAlert("Тренировка начнется скоро!");
    });
}

// Функция сохранения профиля
function saveProfile() {
    console.log("Попытка сохранения профиля...");
    
    // Получаем значения
    const age = parseInt(elements.inputAge.value);
    const height = parseInt(elements.inputHeight.value);
    const weight = parseInt(elements.inputWeight.value);
    const birthdate = elements.inputBirthdate.value;
    
    // Проверяем заполнение
    if (!age || !height || !weight || !birthdate) {
        tg.showAlert("Заполните все поля правильно!");
        console.error("Не все поля заполнены");
        return;
    }
    
    // Обновляем данные
    userData = {
        ...userData,
        age,
        height,
        weight,
        birthdate,
        isFirstTime: false
    };
    
    // Сохраняем и обновляем интерфейс
    saveUserData();
    updateProfileUI();
    showMainView();
    
    tg.showAlert("Профиль успешно сохранен!");
    console.log("Профиль сохранен");
}

// Показать анкету
function showOnboarding() {
    console.log("Показываем анкету");
    elements.mainView.style.display = 'none';
    elements.onboardingView.style.display = 'block';
    
    // Устанавливаем максимальную дату рождения (14+ лет)
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
    elements.inputBirthdate.max = maxDate.toISOString().split('T')[0];
}

// Показать главный экран
function showMainView() {
    console.log("Показываем главный экран");
    elements.onboardingView.style.display = 'none';
    elements.mainView.style.display = 'block';
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);
