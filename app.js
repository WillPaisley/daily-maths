// ==================== CONFIG ====================
// Default profiles – can be overridden by config.js
const DEFAULT_PROFILES = [
    { id: 'dad', name: 'Dad', icon: '👨' },
    { id: 'will', name: 'Will', icon: '👦' },
    { id: 'guest', name: 'Guest', icon: '👤' }
];

// Game settings
const QUESTION_COUNT = 5;
const TIMER_SECONDS = 120;

// ==================== STATE ====================
const state = {
    profiles: window.profiles || DEFAULT_PROFILES,
    currentProfile: null,
    currentDifficulty: null,
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    userAnswers: [],
    timer: null,
    timeLeft: TIMER_SECONDS,
    isTimerRunning: false
};

// ==================== DOM ELEMENTS ====================
const screens = {
    home: document.getElementById('screen-home'),
    profile: document.getElementById('screen-profile'),
    difficulty: document.getElementById('screen-difficulty'),
    question: document.getElementById('screen-question'),
    summary: document.getElementById('screen-summary'),
    results: document.getElementById('screen-results')
};

const elements = {
    profileList: document.getElementById('profile-list'),
    selectedProfileName: document.getElementById('selected-profile-name'),
    profileBack: document.getElementById('profile-back'),
    difficultyBack: document.getElementById('difficulty-back'),
    homeToProfile: document.getElementById('home-to-profile'),
    homeToResults: document.getElementById('home-to-results'),
    questionProfileIndicator: document.getElementById('question-profile-indicator'),
    questionTimer: document.getElementById('question-timer'),
    questionProgress: document.getElementById('question-progress'),
    questionText: document.getElementById('question-text'),
    answerInput: document.getElementById('answer-input'),
    submitAnswer: document.getElementById('submit-answer'),
    questionFeedback: document.getElementById('question-feedback'),
    nextQuestion: document.getElementById('next-question'),
    finalScore: document.getElementById('final-score'),
    summaryToResults: document.getElementById('summary-to-results'),
    summaryHome: document.getElementById('summary-home'),
    resultsContainer: document.getElementById('results-container'),
    resultsBack: document.getElementById('results-back')
};

// ==================== UTILITIES ====================
function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// Seed random generator for consistent daily questions
function createSeededRandom(seed) {
    return function() {
        seed = Math.sin(seed) * 10000;
        return seed - Math.floor(seed);
    };
}

// Generate questions based on profile + difficulty + date
function generateQuestions(profileId, difficulty) {
    const today = new Date().toISOString().slice(0, 10);
    const seedStr = today + profileId + difficulty;
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
        seed += seedStr.charCodeAt(i);
    }
    const rng = createSeededRandom(seed);

    const range = {
        easy: { min: 10, max: 30 },
        medium: { min: 10, max: 99 },
        hard: { min: 20, max: 99 }
    }[difficulty];

    const questions = [];
    for (let i = 0; i < QUESTION_COUNT; i++) {
        // Alternate between multiplication and division
        if (i % 2 === 0) {
            // multiplication
            const a = Math.floor(rng() * (range.max - range.min + 1)) + range.min;
            const b = Math.floor(rng() * (range.max - range.min + 1)) + range.min;
            questions.push({
                text: `${a} × ${b} = ?`,
                answer: a * b,
                type: 'mult'
            });
        } else {
            // division (must be integer result)
            let divisor, quotient, dividend;
            do {
                divisor = Math.floor(rng() * (range.max - range.min + 1)) + range.min;
                quotient = Math.floor(rng() * (range.max - range.min + 1)) + range.min;
                dividend = divisor * quotient;
            } while (dividend > 999); // keep reasonable size
            questions.push({
                text: `${dividend} ÷ ${divisor} = ?`,
                answer: quotient,
                type: 'div'
            });
        }
    }
    return questions;
}

// ==================== LOCAL STORAGE ====================
function getStoredResults() {
    return JSON.parse(localStorage.getItem('mathGameResults') || '{}');
}

function saveResult(profileId, difficulty, score, answers) {
    const results = getStoredResults();
    const today = new Date().toISOString().slice(0, 10);
    if (!results[profileId]) results[profileId] = {};
    if (!results[profileId][difficulty]) results[profileId][difficulty] = [];

    // Keep only the most recent attempt per day
    const dailyAttempts = results[profileId][difficulty].filter(a => a.date !== today);
    dailyAttempts.push({
        date: today,
        score: score,
        answers: answers,
        timestamp: Date.now()
    });
    // Sort by timestamp (newest first) and keep only one per day (we already removed duplicates)
    results[profileId][difficulty] = dailyAttempts.sort((a,b) => b.timestamp - a.timestamp);
    localStorage.setItem('mathGameResults', JSON.stringify(results));
}

// ==================== PROFILE SELECTION ====================
function renderProfiles() {
    elements.profileList.innerHTML = '';
    state.profiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.dataset.id = profile.id;
        card.innerHTML = `
            <div class="profile-icon">${profile.icon}</div>
            <div class="profile-name">${profile.name}</div>
        `;
        card.addEventListener('click', () => selectProfile(profile));
        elements.profileList.appendChild(card);
    });
}

function selectProfile(profile) {
    state.currentProfile = profile;
    // Remove previous selection highlight
    document.querySelectorAll('.profile-card').forEach(c => c.classList.remove('selected'));
    // Find and highlight the selected card
    const selectedCard = document.querySelector(`.profile-card[data-id="${profile.id}"]`);
    if (selectedCard) selectedCard.classList.add('selected');

    // Go to difficulty screen
    elements.selectedProfileName.textContent = `Playing as ${profile.name}`;
    switchScreen('difficulty');
}

// ==================== DIFFICULTY SELECTION ====================
document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.addEventListener('click', (e) => {
        state.currentDifficulty = e.target.dataset.difficulty;
        // Generate fresh questions
        state.questions = generateQuestions(state.currentProfile.id, state.currentDifficulty);
        // Reset game state
        state.currentQuestionIndex = 0;
        state.score = 0;
        state.userAnswers = [];
        // Start question screen
        startQuestion();
    });
});

// ==================== QUESTION SCREEN ====================
function startQuestion() {
    // Show first question
    renderQuestion();
    switchScreen('question');
}

function renderQuestion() {
    const q = state.questions[state.currentQuestionIndex];
    elements.questionText.textContent = q.text;
    elements.answerInput.value = '';
    elements.answerInput.disabled = false;
    elements.submitAnswer.disabled = false;
    elements.questionFeedback.textContent = '';
    elements.nextQuestion.classList.add('hidden');
    elements.answerInput.focus();

    // Update progress
    const progress = ((state.currentQuestionIndex) / QUESTION_COUNT) * 100;
    elements.questionProgress.style.width = progress + '%';

    // Profile indicator
    elements.questionProfileIndicator.textContent = `${state.currentProfile.icon} ${state.currentProfile.name} (${state.currentDifficulty})`;

    // Start timer
    startTimer();
}

function startTimer() {
    state.timeLeft = TIMER_SECONDS;
    state.isTimerRunning = true;
    updateTimerDisplay();

    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();

        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            state.isTimerRunning = false;
            handleTimeout();
        }
    }, 1000);
}

function updateTimerDisplay() {
    elements.questionTimer.textContent = state.timeLeft + 's';
    // Change color when low
    if (state.timeLeft <= 10) {
        elements.questionTimer.style.color = '#ef4444';
    } else if (state.timeLeft <= 30) {
        elements.questionTimer.style.color = '#FF9800';
    } else {
        elements.questionTimer.style.color = '#4CAF50';
    }
}

function handleTimeout() {
    // Auto-submit empty answer (treated as incorrect)
    submitAnswer(true);
}

function stopTimer() {
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
    state.isTimerRunning = false;
}

// Submit answer (timeout or button)
function submitAnswer(isTimeout = false) {
    if (!state.isTimerRunning && !isTimeout) return; // Already answered

    stopTimer();

    const q = state.questions[state.currentQuestionIndex];
    let userAnswer = null;
    let isCorrect = false;

    if (!isTimeout) {
        userAnswer = parseInt(elements.answerInput.value.trim());
        if (!isNaN(userAnswer)) {
            isCorrect = (userAnswer === q.answer);
        }
    }

    if (isCorrect) state.score++;

    // Store answer
    state.userAnswers.push({
        question: q.text,
        userAnswer: isTimeout ? null : userAnswer,
        correctAnswer: q.answer,
        isCorrect: isCorrect,
        type: q.type
    });

    // Show feedback
    if (isTimeout) {
        elements.questionFeedback.textContent = `⏰ Time's up! Correct answer: ${q.answer}`;
    } else if (isCorrect) {
        elements.questionFeedback.textContent = '✅ Correct!';
    } else {
        elements.questionFeedback.textContent = `❌ Wrong. Correct answer: ${q.answer}`;
    }

    elements.answerInput.disabled = true;
    elements.submitAnswer.disabled = true;

    // Show next button
    elements.nextQuestion.classList.remove('hidden');
}

// Move to next question
elements.nextQuestion.addEventListener('click', () => {
    state.currentQuestionIndex++;
    if (state.currentQuestionIndex < QUESTION_COUNT) {
        renderQuestion();
    } else {
        // End of game – show summary
        showSummary();
    }
});

function showSummary() {
    // Save result
    saveResult(state.currentProfile.id, state.currentDifficulty, state.score, state.userAnswers);

    // Update final score display
    elements.finalScore.textContent = `${state.score}/${QUESTION_COUNT}`;
    switchScreen('summary');
}

// ==================== RESULTS SCREEN ====================
function renderAllResults() {
    const results = getStoredResults();
    const container = elements.resultsContainer;
    container.innerHTML = '';

    if (Object.keys(results).length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666;">No results yet. Play some games!</p>';
        return;
    }

    // For each profile
    state.profiles.forEach(profile => {
        const profileResults = results[profile.id];
        if (!profileResults) return;

        // Create card
        const card = document.createElement('div');
        card.className = 'player-result-card';

        let html = `<h3>${profile.icon} ${profile.name}</h3>`;

        // For each difficulty
        const difficulties = ['easy', 'medium', 'hard'];
        difficulties.forEach(diff => {
            const attempts = profileResults[diff] || [];
            if (attempts.length === 0) return;

            // Compute average score
            const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
            const avgScore = (totalScore / attempts.length).toFixed(1);
            const gamesPlayed = attempts.length;

            // Breakdown by question type
            let multCorrect = 0, multTotal = 0;
            let divCorrect = 0, divTotal = 0;
            attempts.forEach(attempt => {
                attempt.answers.forEach((ans, idx) => {
                    if (ans.type === 'mult') {
                        multTotal++;
                        if (ans.isCorrect) multCorrect++;
                    } else {
                        divTotal++;
                        if (ans.isCorrect) divCorrect++;
                    }
                });
            });

            html += `
                <div style="margin-top:15px;">
                    <strong style="text-transform:capitalize;">${diff}</strong> – Games: ${gamesPlayed} | Avg: ${avgScore}/5
                </div>
                <div class="question-type-stats">
                    <span>✖️ ${multCorrect}/${multTotal}</span>
                    <span>➗ ${divCorrect}/${divTotal}</span>
                </div>
            `;
        });

        if (html === `<h3>${profile.icon} ${profile.name}</h3>`) {
            html += '<p style="color:#999;">No games played yet.</p>';
        }

        card.innerHTML = html;
        container.appendChild(card);
    });
}

// ==================== EVENT LISTENERS ====================
// Home to profile
elements.homeToProfile.addEventListener('click', () => {
    renderProfiles();
    switchScreen('profile');
});

// Home to results
elements.homeToResults.addEventListener('click', () => {
    renderAllResults();
    switchScreen('results');
});

// Back buttons
elements.profileBack.addEventListener('click', () => switchScreen('home'));
elements.difficultyBack.addEventListener('click', () => switchScreen('profile'));
elements.resultsBack.addEventListener('click', () => switchScreen('home'));
elements.summaryHome.addEventListener('click', () => switchScreen('home'));

// Summary to results
elements.summaryToResults.addEventListener('click', () => {
    renderAllResults();
    switchScreen('results');
});

// Submit answer on Enter key
elements.answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !elements.submitAnswer.disabled) {
        submitAnswer();
    }
});
elements.submitAnswer.addEventListener('click', () => submitAnswer());

// Initialize
renderProfiles();
