// Конфигурация приложения
const APP_CONFIG = {
    MIN_AGE: 13,
    CALORIES_PER_WORKOUT: 300,
    WEIGHING_FREQUENCY: 30, // дней
    WORKOUT_TYPES: {
        mixed: { name: "Совмещённая", emoji: "⚡", desc: "Сила + кардио" },
        strength: { name: "Силовая", emoji: "💪", desc: "С собственным весом" },
        cardio: { name: "Кардио", emoji: "🏃", desc: "Интервальная" },
        walking: { name: "Ходьба", emoji: "🚶", desc: "Скандинавская/обычная" },
        cycling: { name: "Велоезда", emoji: "🚴", desc: "Стационарный велосипед" }
    }
};

// Система статусов
const STATUS_SYSTEM = [
    { min: 0, max: 10, name: "Новичок", emoji: "👶", class: "status-beginner" },
    { min: 10, max: 25, name: "Деловой", emoji: "💼", class: "status-business" },
    { min: 25, max: 50, name: "Профи", emoji: "🔥", class: "status-pro" },
    { min: 50, max: 80, name: "Гигачад", emoji: "💪", class: "status-gigachad" },
    { min: 80, max: 120, name: "RIKOS", emoji: "🏆", class: "status-rikos" },
    { min: 120, max: 200, name: "RIKOS DEL", emoji: "🏅", class: "status-rikos-del" },
    { min: 200, max: 300, name: "RIKOS MEGA", emoji: "🎖️", class: "status-rikos-mega" },
    { min: 300, max: 888, name: "RIKOS GIGA", emoji: "👑", class: "status-rikos-giga" },
    { min: 888, max: 1026, name: "ULTRA RIKOS", emoji: "🦸", class: "status-ultra-rikos" },
    { min: 1026, max: 5000, name: "RIKOS III", emoji: "🧙‍♂️", class: "status-rikos-iii" },
    { min: 5000, max: 20000, name: "RIKOS II", emoji: "🧞‍♂️", class: "status-rikos-ii" },
    { min: 20000, max: Infinity, name: "RIKOS I", emoji: "🦹‍♂️", class: "status-rikos-i" }
];

// Упражнения для разных типов тренировок
const WORKOUTS_DB = {
    mixed: [
        { name: "Берпи", sets: 3, reps: 10, duration: 45 },
        { name: "Прыжки", sets: 3, reps: 15, duration: 30 }
    ],
    strength: [
        { name: "Приседания", sets: 3, reps: 12, duration: 40 },
        { name: "Отжимания", sets: 3, reps: 10, duration: 45 }
    ],
    cardio: [
        { name: "Бег на месте", sets: 1, duration: 300 },
        { name: "Прыжки", sets: 1, duration: 180 }
    ],
    walking: [
        { name: "Ходьба", sets: 1, duration: 1800 }
    ],
    cycling: [
        { name: "Велосипед", sets: 1, duration: 1200 }
    ]
};

class RikoFitnessApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.tg.expand();
        this.userData = this.loadUserData();
        this.currentWorkout = null;
        this.timer = null;
        this.initElements();
        this.setupEventListeners();
        this.initCharts();
        this.checkBirthday();
        this.checkWeighing();
        this.updateUI();
        
        if (this.userData.isFirstTime) {
            this.showOnboarding();
        } else {
            this.showMainView();
        }
    }

    // Загрузка данных пользователя
    loadUserData() {
        let data = localStorage.getItem('rikoFitnessData');
        const defaultData = {
            isFirstTime: true,
            joinDate: new Date().toISOString(),
            workoutsCompleted: 0,
            caloriesBurned: 0,
            dailyStats: {},
            workoutDays: [1, 3, 5], // Пн, Ср, Пт по умолчанию
            workoutTime: "19:00",
            notificationsEnabled: true,
            lastWeighing: new Date().toISOString(),
            weightHistory: [],
            height: null,
            weight: null,
            birthdate: null
        };

        if (!data) return defaultData;

        data = JSON.parse(data);
        return { ...defaultData, ...data };
    }

    // Сохранение данных
    saveUserData() {
        localStorage.setItem('rikoFitnessData', JSON.stringify(this.userData));
        
        // Синхронизация с ботом
        if (this.tg.initDataUnsafe.user?.id) {
            const botData = {
                userId: this.tg.initDataUnsafe.user.id,
                workouts: this.userData.workoutsCompleted,
                lastWorkout: this.userData.lastWorkout,
                nextWeighing: this.getNextWeighingDate()
            };
            // Здесь должна быть отправка данных боту
        }
    }

    // Инициализация DOM элементов
    initElements() {
        this.elements = {
            // Шапка
            profileHeader: document.getElementById('profile-header'),
            userName: document.getElementById('user-name'),
            userStatus: document.getElementById('user-status'),
            dailyCalories: document.getElementById('daily-calories'),
            userAvatar: document.getElementById('user-avatar'),
            
            // Главный экран
            mainView: document.getElementById('main-view'),
            workoutCount: document.getElementById('workout-count'),
            totalCalories: document.getElementById('total-calories'),
            weeklyChart: document.getElementById('weekly-chart'),
            weeklyTotal: document.getElementById('weekly-total'),
            startWorkoutBtn: document.getElementById('start-workout-btn'),
            openProfileBtn: document.getElementById('open-profile-btn'),
            
            // Профиль
            profileModal: document.getElementById('profile-modal'),
            profileName: document.getElementById('profile-name'),
            profileAge: document.getElementById('profile-age'),
            profileHeight: document.getElementById('profile-height'),
            profileWeight: document.getElementById('profile-weight'),
            profileBirthdate: document.getElementById('profile-birthdate'),
            profileJoinDate: document.getElementById('profile-join-date'),
            profileWorkouts: document.getElementById('profile-workouts'),
            profileTotalCalories: document.getElementById('profile-total-calories'),
            nextWeighing: document.getElementById('next-weighing'),
            closeProfileBtn: document.getElementById('close-profile-btn'),
            editProfileBtn: document.getElementById('edit-profile-btn'),
            
            // Настройки
            workoutTime: document.getElementById('workout-time'),
            notificationsEnabled: document.getElementById('notifications-enabled'),
            dayButtons: document.querySelectorAll('.day-btn'),
            
            // Тренировка
            workoutSelectionView: document.getElementById('workout-selection-view'),
            workoutScreenView: document.getElementById('workout-screen-view'),
            currentExercise: document.getElementById('current-exercise'),
            exerciseTimer: document.getElementById('exercise-timer'),
            exerciseTarget: document.getElementById('exercise-target'),
            completedReps: document.getElementById('completed-reps'),
            startTimerBtn: document.getElementById('start-timer-btn'),
            completeExerciseBtn: document.getElementById('complete-exercise-btn'),
            
            // Анкета
            onboardingView: document.getElementById('onboarding-view'),
            inputHeight: document.getElementById('input-height'),
            inputWeight: document.getElementById('input-weight'),
            inputBirthdate: document.getElementById('input-birthdate'),
            saveProfileBtn: document.getElementById('save-profile-btn')
        };
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Профиль
        this.elements.profileHeader.addEventListener('click', () => this.showProfile());
        this.elements.closeProfileBtn.addEventListener('click', () => this.hideProfile());
        this.elements.editProfileBtn.addEventListener('click', () => this.editProfile());
        this.elements.openProfileBtn.addEventListener('click', () => this.showProfile());
        
        // Тренировки
        this.elements.startWorkoutBtn.addEventListener('click', () => this.showWorkoutSelection());
        document.querySelectorAll('.workout-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.startWorkout(type);
            });
        });
        
        // Таймер
        this.elements.startTimerBtn.addEventListener('click', () => this.toggleTimer());
        this.elements.completeExerciseBtn.addEventListener('click', () => this.completeExercise());
        document.getElementById('increase-reps').addEventListener('click', () => this.changeReps(1));
        document.getElementById('decrease-reps').addEventListener('click', () => this.changeReps(-1));
        
        // Дни тренировок
        this.elements.dayButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const day = parseInt(e.currentTarget.dataset.day);
                this.toggleWorkoutDay(day);
            });
        });
        
        // Анкета
        this.elements.saveProfileBtn.addEventListener('click', () => this.saveProfile());
    }

    // Инициализация графиков
    initCharts() {
        this.weeklyChart = new Chart(this.elements.weeklyChart, {
            type: 'bar',
            data: this.getWeeklyChartData(),
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Калории' }
                    }
                }
            }
        });
    }

    // Обновление интерфейса
    updateUI() {
        this.updateProfileHeader();
        this.updateProfileModal();
        this.updateWeeklyStats();
        this.updateChart();
        this.updateWorkoutDays();
    }

    // Обновление шапки профиля
    updateProfileHeader() {
        // Данные из Telegram
        if (this.tg.initDataUnsafe.user) {
            const user = this.tg.initDataUnsafe.user;
            this.userData.name = `${user.first_name} ${user.last_name || ''}`.trim();
            if (user.photo_url) {
                this.elements.userAvatar.style.backgroundImage = `url(${user.photo_url})`;
            }
        }
        
        // Статус
        const status = this.getUserStatus();
        this.elements.userName.textContent = this.userData.name || "Пользователь";
        this.elements.userStatus.innerHTML = `${status.emoji} ${status.name}`;
        this.elements.userStatus.className = `status ${status.class}`;
        
        // Калории за сегодня
        const today = new Date().toISOString().split('T')[0];
        const todayCalories = this.userData.dailyStats[today]?.calories || 0;
        this.elements.dailyCalories.textContent = `Сегодня: ${todayCalories} ккал`;
        
        // Общая статистика
        this.elements.workoutCount.textContent = this.userData.workoutsCompleted;
        this.elements.totalCalories.textContent = this.userData.caloriesBurned;
    }

    // Обновление модального окна профиля
    updateProfileModal() {
        this.elements.profileName.textContent = this.userData.name;
        
        // Возраст
        if (this.userData.birthdate) {
            const age = this.calculateAge(this.userData.birthdate);
            this.elements.profileAge.textContent = `${age} лет`;
        }
        
        // Физические данные
        this.elements.profileHeight.textContent = this.userData.height || "-";
        this.elements.profileWeight.textContent = this.userData.weight || "-";
        this.elements.profileBirthdate.textContent = this.userData.birthdate ? 
            new Date(this.userData.birthdate).toLocaleDateString() : "-";
        
        // Даты
        this.elements.profileJoinDate.textContent = new Date(this.userData.joinDate).toLocaleDateString();
        this.elements.nextWeighing.textContent = this.getNextWeighingDate();
        
        // Статистика
        this.elements.profileWorkouts.textContent = this.userData.workoutsCompleted;
        this.elements.profileTotalCalories.textContent = this.userData.caloriesBurned;
        
        // Настройки
        this.elements.workoutTime.value = this.userData.workoutTime;
        this.elements.notificationsEnabled.checked = this.userData.notificationsEnabled;
    }

    // Обновление дней тренировок
    updateWorkoutDays() {
        this.elements.dayButtons.forEach(btn => {
            const day = parseInt(btn.dataset.day);
            btn.classList.toggle('active', this.userData.workoutDays.includes(day));
        });
    }

    // Переключение дня тренировки
    toggleWorkoutDay(day) {
        const index = this.userData.workoutDays.indexOf(day);
        if (index === -1) {
            this.userData.workoutDays.push(day);
        } else {
            this.userData.workoutDays.splice(index, 1);
        }
        this.userData.workoutDays.sort();
        this.saveUserData();
        this.updateWorkoutDays();
    }

    // Получение статуса пользователя
    getUserStatus() {
        const workouts = this.userData.workoutsCompleted;
        return STATUS_SYSTEM.find(s => workouts >= s.min && workouts < s.max) || 
               STATUS_SYSTEM[STATUS_SYSTEM.length - 1];
    }

    // Расчет возраста
    calculateAge(birthdate) {
        const today = new Date();
        const birthDate = new Date(birthdate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    // Проверка дня рождения
    checkBirthday() {
        if (!this.userData.birthdate) return;
        
        const today = new Date();
        const birthDate = new Date(this.userData.birthdate);
        
        if (today.getMonth() === birthDate.getMonth() && 
            today.getDate() === birthDate.getDate()) {
            this.showBirthdayCongrats();
        }
    }

    // Поздравление с днем рождения
    showBirthdayCongrats() {
        const age = this.calculateAge(this.userData.birthdate);
        const message = `🎉 С Днем Рождения! 🎂 Сегодня вам исполняется ${age} лет!`;
        
        // В приложении
        this.tg.showAlert(message);
        
        // В чате бота
        if (this.tg.initDataUnsafe.user?.id && this.userData.notificationsEnabled) {
            // Отправка сообщения боту
        }
    }

    // Проверка взвешивания
    checkWeighing() {
        const nextWeighing = new Date(this.userData.lastWeighing);
        nextWeighing.setDate(nextWeighing.getDate() + APP_CONFIG.WEIGHING_FREQUENCY);
        
        if (new Date() >= nextWeighing) {
            this.showWeighingReminder();
        }
    }

    // Напоминание о взвешивании
    showWeighingReminder() {
        this.tg.showAlert("📢 Пора провести ежемесячное взвешивание!");
        this.elements.nextWeighing.textContent = "Сегодня!";
        this.elements.nextWeighing.classList.add('urgent');
    }

    // Получение даты следующего взвешивания
    getNextWeighingDate() {
        const lastWeighing = new Date(this.userData.lastWeighing);
        const nextWeighing = new Date(lastWeighing);
        nextWeighing.setDate(lastWeighing.getDate() + APP_CONFIG.WEIGHING_FREQUENCY);
        return nextWeighing.toLocaleDateString();
    }

    // Навигация
    showOnboarding() {
        this.hideAllViews();
        this.elements.onboardingView.style.display = 'block';
        
        // Установка максимальной даты (13+ лет)
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - APP_CONFIG.MIN_AGE, today.getMonth(), today.getDate());
        this.elements.inputBirthdate.max = maxDate.toISOString().split('T')[0];
    }

    showMainView() {
        this.hideAllViews();
        this.elements.mainView.style.display = 'block';
        this.updateUI();
    }

    showWorkoutSelection() {
        this.hideAllViews();
        this.elements.workoutSelectionView.style.display = 'block';
    }

    showProfile() {
        this.elements.profileModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideProfile() {
        this.elements.profileModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.saveUserData();
    }

    hideAllViews() {
        document.querySelectorAll('section').forEach(view => {
            view.style.display = 'none';
        });
    }

    // Тренировки
    startWorkout(type) {
        this.currentWorkout = {
            type,
            exercises: [...WORKOUTS_DB[type]],
            currentExercise: 0,
            timeLeft: 0,
            isTimerRunning: false
        };
        this.showExercise();
    }

    showExercise() {
        if (this.currentWorkout.currentExercise >= this.currentWorkout.exercises.length) {
            this.finishWorkout();
            return;
        }
        
        const exercise = this.currentWorkout.exercises[this.currentWorkout.currentExercise];
        this.elements.currentExercise.textContent = exercise.name;
        
        if (exercise.reps) {
            this.elements.exerciseTarget.textContent = `Подходы: ${exercise.sets} × ${exercise.reps} повт.`;
            this.elements.completedReps.textContent = exercise.reps;
        } else {
            this.elements.exerciseTarget.textContent = `Длительность: ${this.formatTime(exercise.duration)}`;
            this.elements.completedReps.textContent = "0";
        }
        
        this.currentWorkout.timeLeft = exercise.duration || 30;
        this.elements.exerciseTimer.textContent = this.formatTime(this.currentWorkout.timeLeft);
        this.elements.startTimerBtn.textContent = "▶️ Запустить";
        this.currentWorkout.isTimerRunning = false;
        
        this.hideAllViews();
        this.elements.workoutScreenView.style.display = 'block';
    }

    toggleTimer() {
        if (this.currentWorkout.isTimerRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        this.currentWorkout.isTimerRunning = true;
        this.elements.startTimerBtn.textContent = "⏸ Пауза";
        
        this.timer = setInterval(() => {
            this.currentWorkout.timeLeft--;
            this.elements.exerciseTimer.textContent = this.formatTime(this.currentWorkout.timeLeft);
            
            if (this.currentWorkout.timeLeft <= 0) {
                clearInterval(this.timer);
                this.currentWorkout.isTimerRunning = false;
                this.elements.startTimerBtn.textContent = "✅ Готово";
            }
        }, 1000);
    }

    pauseTimer() {
        clearInterval(this.timer);
        this.currentWorkout.isTimerRunning = false;
        this.elements.startTimerBtn.textContent = "▶️ Продолжить";
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' + secs : secs}`;
    }

    changeReps(change) {
        const reps = parseInt(this.elements.completedReps.textContent) + change;
        if (reps >= 0) this.elements.completedReps.textContent = reps;
    }

    completeExercise() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Запись результатов
        const today = new Date().toISOString().split('T')[0];
        if (!this.userData.dailyStats[today]) {
            this.userData.dailyStats[today] = { calories: 0, workouts: 0 };
        }
        
        this.userData.dailyStats[today].workouts += 1;
        this.userData.dailyStats[today].calories += APP_CONFIG.CALORIES_PER_WORKOUT;
        
        this.currentWorkout.currentExercise++;
        this.showExercise();
    }

    finishWorkout() {
        // Обновление статистики
        this.userData.workoutsCompleted++;
        this.userData.caloriesBurned += APP_CONFIG.CALORIES_PER_WORKOUT;
        this.userData.lastWorkout = new Date().toISOString();
        
        // Сохранение и обновление
        this.saveUserData();
        this.updateUI();
        this.showMainView();
        
        // Уведомление
        const workoutType = APP_CONFIG.WORKOUT_TYPES[this.currentWorkout.type].name;
        this.tg.showAlert(`Тренировка "${workoutType}" завершена! 🎉`);
        
        // Уведомление в чат
        if (this.tg.initDataUnsafe.user?.id && this.userData.notificationsEnabled) {
            // Отправка данных боту
        }
    }

    // Анкета
    saveProfile() {
        const height = parseInt(this.elements.inputHeight.value);
        const weight = parseInt(this.elements.inputWeight.value);
        const birthdate = this.elements.inputBirthdate.value;
        
        if (!height || !weight || !birthdate) {
            this.tg.showAlert("Заполните все поля правильно!");
            return;
        }
        
        // Проверка возраста
        const age = this.calculateAge(birthdate);
        if (age < APP_CONFIG.MIN_AGE) {
            this.tg.showAlert(`Минимальный возраст для регистрации: ${APP_CONFIG.MIN_AGE} лет`);
            return;
        }
        
        // Сохранение данных
        this.userData.height = height;
        this.userData.weight = weight;
        this.userData.birthdate = birthdate;
        this.userData.isFirstTime = false;
        
        // Первое взвешивание
        this.userData.weightHistory.push({
            date: new Date().toISOString(),
            weight: weight
        });
        
        this.saveUserData();
        this.updateUI();
        this.showMainView();
        this.tg.showAlert("Профиль сохранен!");
    }

    editProfile() {
        this.hideProfile();
        this.showOnboarding();
        this.elements.inputHeight.value = this.userData.height;
        this.elements.inputWeight.value = this.userData.weight;
        this.elements.inputBirthdate.value = this.userData.birthdate;
    }

    // Статистика
    getWeeklyChartData() {
        const lastWeek = this.getLastWeekDates();
        const data = lastWeek.map(date => {
            return this.userData.dailyStats[date]?.calories || 0;
        });
        
        // Общее за неделю
        const weeklyTotal = data.reduce((sum, calories) => sum + calories, 0);
        this.elements.weeklyTotal.textContent = weeklyTotal;
        
        return {
            labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
            datasets: [{
                label: 'Сожжено калорий',
                data: data,
                backgroundColor: '#6C63FF'
            }]
        };
    }

    updateChart() {
        this.weeklyChart.data = this.getWeeklyChartData();
        this.weeklyChart.update();
    }

    updateWeeklyStats() {
        const data = this.getWeeklyChartData();
        this.elements.weeklyTotal.textContent = data.datasets[0].data.reduce((a, b) => a + b, 0);
    }

    getLastWeekDates() {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RikoFitnessApp();
});
