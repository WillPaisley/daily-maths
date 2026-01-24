// App state
const state = {
  currentQuestion: 0,
  score: 0,
  userAnswers: [],
  questions: [],
  currentProfile: null,
  profiles: [],
  gameSettings: null,
  timer: null,
  timeLeft: 100,
  isTimerRunning: false
};

// DOM Elements
const screens = {
  welcome: document.getElementById('welcome-screen'),
  profile: document.getElementById('profile-screen'),
  question: document.getElementById('question-screen'),
  results: document.getElementById('results-screen')
};

const elements = {
  currentDate: document.getElementById('current-date'),
  selectProfileBtn: document.getElementById('select-profile-btn'),
  profilesContainer: document.getElementById('profiles-container'),
  backToWelcomeBtn: document.getElementById('back-to-welcome-btn'),
  startGameBtn: document.getElementById('start-game-btn'),
  questionText: document.getElementById('question-text'),
  answerInput: document.getElementById('answer-input'),
  submitAnswerBtn: document.getElementById('submit-answer-btn'),
  skipBtn: document.getElementById('skip-btn'),
  currentQuestion: document.getElementById('current-question'),
  progressFill: document.getElementById('progress-fill'),
  finalScore: document.getElementById('final-score'),
  resultDetails: document.getElementById('result-details'),
  encouragementMessage: document.getElementById('encouragement-message'),
  restartBtn: document.getElementById('restart-btn'),
  newProfileBtn: document.getElementById('new-profile-btn'),
  shareBtn: document.getElementById('share-btn'),
  scoreCircle: document.getElementById('score-circle'),
  currentProfileName: document.getElementById('current-profile-name'),
  currentProfileIndicator: document.getElementById('current-profile-indicator'),
  resultsProfileName: document.getElementById('results-profile-name'),
  resultsProfileIcon: document.getElementById('results-profile-icon'),
  timerCircle: document.getElementById('timer-circle'),
  timerSeconds: document.getElementById('timer-seconds')
};

// Seed-based random number generator
function createSeededRandom(seed) {
  return function() {
    seed = Math.sin(seed) * 10000;
    return seed - Math.floor(seed);
  };
}

// Generate multiplication question based on difficulty
function generateMultiplication(rng, difficulty) {
  const range = state.gameSettings.numberRange[difficulty];
  const a = Math.floor(rng() * (range.max - range.min + 1)) + range.min;
  const b = Math.floor(rng() * (range.max - range.min + 1)) + range.min;
  const correctAnswer = a * b;
  
  return {
    question: `${a} × ${b} = ?`,
    correctAnswer: correctAnswer,
    type: 'multiplication'
  };
}

// Generate division question based on difficulty
function generateDivision(rng, difficulty) {
  const range = state.gameSettings.numberRange[difficulty];
  const divisor = Math.floor(rng() * (range.max - range.min + 1)) + range.min;
  const quotient = Math.floor(rng() * (range.max - range.min + 1)) + range.min;
  const dividend = divisor * quotient;
  const correctAnswer = quotient;
  
  return {
    question: `${dividend} ÷ ${divisor} = ?`,
    correctAnswer: correctAnswer,
    type: 'division'
  };
}

// Generate today's questions based on profile difficulty
function generateDailyQuestions(profile) {
  const today = new Date().toISOString().slice(0, 10);
  const seed = Array.from(today).reduce((acc, char) => acc + char.charCodeAt(0), 0) + profile.id;
  const rng = createSeededRandom(seed);
  const difficulty = profile.difficulty;
  
  const questions = [];
  for (let i = 0; i < state.gameSettings.dailyQuestions; i++) {
    if (i % 2 === 0) {
      questions.push(generateMultiplication(rng, difficulty));
    } else {
      questions.push(generateDivision(rng, difficulty));
    }
  }
  
  return questions;
}

// Format date
function formatDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('en-US', options);
}

// Switch screen
function switchScreen(screenName) {
  Object.values(screens).forEach(screen => {
    screen.classList.remove('active');
  });
  screens[screenName].classList.add('active');
}

// Start the timer
function startTimer() {
  // Reset timer state
  state.timeLeft = 60;
  state.isTimerRunning = true;
  
  // Update timer display
  updateTimerDisplay();
  
  // Set up timer circle animation
  const circumference = 2 * Math.PI * 54;
  elements.timerCircle.style.strokeDasharray = circumference;
  elements.timerCircle.style.strokeDashoffset = 0;
  
  // Clear any existing timer
  if (state.timer) {
    clearInterval(state.timer);
  }
  
  // Start countdown
  state.timer = setInterval(() => {
    state.timeLeft--;
    updateTimerDisplay();
    
    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      state.isTimerRunning = false;
      // Auto-submit when time runs out
      submitAnswer();
    }
  }, 1000);
}

// Update timer display
function updateTimerDisplay() {
  elements.timerSeconds.textContent = state.timeLeft;
  
  // Update timer circle
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (state.timeLeft / 60) * circumference;
  elements.timerCircle.style.strokeDashoffset = offset;
  
  // Change color based on time left
  if (state.timeLeft <= 10) {
    elements.timerCircle.style.stroke = '#ef4444'; // Red
  } else if (state.timeLeft <= 30) {
    elements.timerCircle.style.stroke = '#FF9800'; // Orange
  } else {
    elements.timerCircle.style.stroke = '#4CAF50'; // Green
  }
}

// Stop the timer
function stopTimer() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  state.isTimerRunning = false;
}

// Render profile selection screen
function renderProfiles() {
  elements.profilesContainer.innerHTML = '';
  
  state.profiles.forEach(profile => {
    const profileCard = document.createElement('div');
    profileCard.className = 'profile-card';
    profileCard.dataset.profileId = profile.id;
    
    profileCard.innerHTML = `
      <div class="profile-icon">${profile.icon}</div>
      <h3>${profile.name}</h3>
      <p class="profile-difficulty">${profile.difficulty.charAt(0).toUpperCase() + profile.difficulty.slice(1)} Difficulty</p>
    `;
    
    // Apply profile color
    profileCard.style.borderColor = profile.color;
    profileCard.style.backgroundColor = profile.backgroundColor;
    
    profileCard.addEventListener('click', () => selectProfile(profile.id));
    elements.profilesContainer.appendChild(profileCard);
  });
}

// Select a profile
function selectProfile(profileId) {
  // Clear previous selection
  document.querySelectorAll('.profile-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Mark selected profile
  const selectedCard = document.querySelector(`[data-profile-id="${profileId}"]`);
  selectedCard.classList.add('selected');
  
  // Find and set current profile
  state.currentProfile = state.profiles.find(p => p.id === profileId);
  
  // Enable start button
  elements.startGameBtn.disabled = false;
  
  // Update start button text
  elements.startGameBtn.textContent = `Start as ${state.currentProfile.name}`;
}

// Render current question
function renderQuestion() {
  const question = state.questions[state.currentQuestion];
  
  // Update progress
  elements.currentQuestion.textContent = state.currentQuestion + 1;
  elements.progressFill.style.width = `${((state.currentQuestion) / state.gameSettings.dailyQuestions) * 100}%`;
  
  // Set question text
  elements.questionText.textContent = question.question;
  
  // Clear input field
  elements.answerInput.value = '';
  elements.answerInput.disabled = false;
  elements.answerInput.focus();
  
  // Update button text
  elements.submitAnswerBtn.textContent = 'Submit Answer';
  elements.submitAnswerBtn.disabled = false;
  
  // Stop any existing timer
  stopTimer();
  
  // Start new timer
  startTimer();
}

// Submit answer
function submitAnswer() {
  if (!state.isTimerRunning && state.timeLeft > 0) {
    return; // Don't submit if timer already expired
  }
  
  // Stop the timer
  stopTimer();
  
  const question = state.questions[state.currentQuestion];
  const userAnswer = parseInt(elements.answerInput.value.trim());
  const isCorrect = userAnswer === question.correctAnswer;
  
  // Update score
  if (isCorrect) {
    state.score++;
  }
  
  // Store user answer
  state.userAnswers.push({
    question: question.question,
    userAnswer: userAnswer,
    correctAnswer: question.correctAnswer,
    isCorrect: isCorrect,
    timeLeft: state.timeLeft
  });
  
  // Disable input and show result
  elements.answerInput.disabled = true;
  elements.submitAnswerBtn.disabled = true;
  
  // Show feedback
  if (isCorrect) {
    elements.answerInput.classList.add('correct-answer');
    elements.submitAnswerBtn.textContent = '✓ Correct!';
  } else {
    elements.answerInput.classList.add('incorrect-answer');
    elements.submitAnswerBtn.textContent = `✗ Correct: ${question.correctAnswer}`;
  }
  
  // Move to next question after a delay
  setTimeout(() => {
    nextQuestion();
  }, 1500);
}

// Skip question
function skipQuestion() {
  // Stop the timer
  stopTimer();
  
  const question = state.questions[state.currentQuestion];
  
  // Store user answer as skipped
  state.userAnswers.push({
    question: question.question,
    userAnswer: null,
    correctAnswer: question.correctAnswer,
    isCorrect: false,
    timeLeft: state.timeLeft,
    skipped: true
  });
  
  // Show feedback
  elements.answerInput.disabled = true;
  elements.submitAnswerBtn.textContent = `Skipped (Answer: ${question.correctAnswer})`;
  elements.submitAnswerBtn.disabled = true;
  
  // Move to next question after a delay
  setTimeout(() => {
    nextQuestion();
  }, 1500);
}

// Move to next question
function nextQuestion() {
  state.currentQuestion++;
  
  if (state.currentQuestion < state.questions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

// Show results
function showResults() {
  // Update profile info in results
  elements.resultsProfileName.textContent = state.currentProfile.name;
  elements.resultsProfileIcon.textContent = state.currentProfile.icon;
  
  // Update final score
  elements.finalScore.textContent = state.score;
  
  // Calculate percentage for circle animation
  const percentage = (state.score / state.gameSettings.dailyQuestions) * 100;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (percentage / 100) * circumference;
  
  // Animate score circle
  setTimeout(() => {
    elements.scoreCircle.style.strokeDashoffset = offset;
    document.querySelector('.score-percent').textContent = `${Math.round(percentage)}%`;
  }, 100);
  
  // Show question results
  elements.resultDetails.innerHTML = '';
  state.userAnswers.forEach((result, index) => {
    const resultDiv = document.createElement('div');
    resultDiv.className = `question-result ${result.isCorrect ? 'correct' : 'incorrect'}`;
    
    // Add difficulty indicator
    const difficultyClass = result.type === 'multiplication' ? 'multiplication' : 'division';
    const typeIcon = result.type === 'multiplication' ? '×' : '÷';
    
    let answerText = '';
    if (result.skipped) {
      answerText = '⏭️ Skipped';
    } else if (result.isCorrect) {
      answerText = `✓ Correct! (${result.timeLeft}s left)`;
    } else {
      answerText = `✗ You answered ${result.userAnswer}, correct was ${result.correctAnswer}`;
    }
    
    resultDiv.innerHTML = `
      <div class="question-type ${difficultyClass}">${typeIcon}</div>
      <div class="question-content">
        <div class="question-text">Q${index + 1}: ${result.question}</div>
        <div class="question-answer">
          ${answerText}
        </div>
      </div>
    `;
    
    elements.resultDetails.appendChild(resultDiv);
  });
  
  // Show encouragement message
  let message = '';
  if (state.score === state.gameSettings.dailyQuestions) {
    message = `🎉 Perfect score ${state.currentProfile.name}! You are a math genius! 🧠`;
  } else if (state.score >= 4) {
    message = `🌟 Excellent work ${state.currentProfile.name}! You're really good at this!`;
  } else if (state.score >= 3) {
    message = `👍 Good job ${state.currentProfile.name}! Keep practicing to get even better!`;
  } else {
    message = `💪 Every challenge makes you stronger ${state.currentProfile.name}. Try again tomorrow!`;
  }
  elements.encouragementMessage.textContent = message;
  
  // Switch to results screen
  switchScreen('results');
}

// Share score
function shareScore() {
  const shareText = `${state.currentProfile.name} scored ${state.score}/5 on the Daily Mental Math Challenge! 🧮\n\nTry it yourself: ${window.location.href}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Daily Mental Math Challenge',
      text: shareText,
      url: window.location.href
    });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText).then(() => {
      alert('Score copied to clipboard! 📋');
    });
  } else {
    alert(shareText);
  }
}

// Reset game state
function resetGameState() {
  state.currentQuestion = 0;
  state.score = 0;
  state.userAnswers = [];
  stopTimer();
  
  // Generate new questions for current profile
  if (state.currentProfile) {
    state.questions = generateDailyQuestions(state.currentProfile);
  }
}

// Initialize app
function init() {
  // Load profiles and settings from config.js
  state.profiles = window.profiles || [];
  state.gameSettings = window.gameSettings || {
    dailyQuestions: 5,
    defaultDifficulty: "medium",
    numberRange: {
      easy: { min: 10, max: 30 },
      medium: { min: 10, max: 99 },
      hard: { min: 20, max: 99 }
    }
  };
  
  // If no profiles were loaded from config.js, show an error
  if (state.profiles.length === 0) {
    console.error('No profiles found. Please check config.js');
    alert('No profiles configured. Please check the config.js file.');
    return;
  }
  
  // Set current date
  elements.currentDate.textContent = formatDate();
  
  // Render profiles
  renderProfiles();
  
  // Event listeners
  elements.selectProfileBtn.addEventListener('click', () => switchScreen('profile'));
  elements.backToWelcomeBtn.addEventListener('click', () => switchScreen('welcome'));
  
  elements.startGameBtn.addEventListener('click', () => {
    if (!state.currentProfile) return;
    
    // Update current profile display
    elements.currentProfileName.textContent = state.currentProfile.name;
    elements.currentProfileIndicator.querySelector('.profile-icon').textContent = state.currentProfile.icon;
    elements.currentProfileIndicator.style.borderColor = state.currentProfile.color;
    elements.currentProfileIndicator.style.backgroundColor = state.currentProfile.backgroundColor;
    
    // Generate questions for selected profile
    state.questions = generateDailyQuestions(state.currentProfile);
    
    // Reset game state
    resetGameState();
    
    // Switch to question screen and render first question
    switchScreen('question');
    renderQuestion();
  });
  
  // Submit answer button
  elements.submitAnswerBtn.addEventListener('click', submitAnswer);
  
  // Skip question button
  elements.skipBtn.addEventListener('click', skipQuestion);
  
  // Enter key to submit answer
  elements.answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitAnswer();
    }
  });
  
  // Only allow numbers in input
  elements.answerInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });
  
  elements.restartBtn.addEventListener('click', () => {
    resetGameState();
    
    // Reset UI
    elements.progressFill.style.width = '0%';
    elements.scoreCircle.style.strokeDashoffset = '339.292';
    document.querySelector('.score-percent').textContent = '0%';
    
    // Switch back to question screen
    switchScreen('question');
    renderQuestion();
  });
  
  elements.newProfileBtn.addEventListener('click', () => {
    switchScreen('profile');
  });
  
  elements.shareBtn.addEventListener('click', shareScore);
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', init);
