// App state

console.log('=== DEBUG: Screen Elements ===');
console.log('Welcome screen:', document.getElementById('welcome-screen'));
console.log('Profile screen:', document.getElementById('profile-screen'));
console.log('Question screen:', document.getElementById('question-screen'));
console.log('Results screen:', document.getElementById('results-screen'));

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

// LocalStorage Management
function getStoredResults() {
  const stored = localStorage.getItem('mathGameResults');
  return stored ? JSON.parse(stored) : {};
}

function saveResults(results) {
  localStorage.setItem('mathGameResults', JSON.stringify(results));
}

function getProfileResults(profileId) {
  const results = getStoredResults();
  return results[profileId] || { attempts: [], averageScore: 0, totalGames: 0 };
}

function saveProfileResult(profileId, score) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const now = Date.now();
  
  const results = getStoredResults();
  
  if (!results[profileId]) {
    results[profileId] = { attempts: [], averageScore: 0, totalGames: 0 };
  }
  
  const profile = results[profileId];
  
  // Remove any existing attempt from today
  profile.attempts = profile.attempts.filter(attempt => 
    attempt.date !== today
  );
  
  // Add today's attempt (keeping only newest)
  profile.attempts.push({
    date: today,
    score: score,
    timestamp: now
  });
  
  // Sort by timestamp descending (newest first)
  profile.attempts.sort((a, b) => b.timestamp - a.timestamp);
  
  // Keep only one per day (newest)
  const uniqueDays = {};
  profile.attempts = profile.attempts.filter(attempt => {
    if (!uniqueDays[attempt.date]) {
      uniqueDays[attempt.date] = true;
      return true;
    }
    return false;
  });
  
  // Recalculate statistics
  profile.totalGames = profile.attempts.length;
  profile.averageScore = profile.attempts.length > 0
    ? profile.attempts.reduce((sum, attempt) => sum + attempt.score, 0) / profile.attempts.length
    : 0;
  
  // Save back to localStorage
  saveResults(results);
  
  return {
    todayScore: score,
    averageScore: profile.averageScore,
    totalGames: profile.totalGames
  };
}

function getProfileStatistics(profileId) {
  const today = new Date().toISOString().slice(0, 10);
  const profile = getProfileResults(profileId);
  
  // Find today's score
  const todayAttempt = profile.attempts.find(attempt => attempt.date === today);
  
  return {
    todayScore: todayAttempt ? todayAttempt.score : 0,
    averageScore: profile.averageScore || 0,
    totalGames: profile.totalGames || 0
  };
}

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

// Switch screen - UPDATED WITH NULL CHECK
function switchScreen(screenName) {
  console.log(`🔀 switchScreen called with: "${screenName}"`);
  
  // Debug: Show available screens
  console.log('Available screens:', Object.keys(screens));
  
  // Only process screens that exist
  Object.values(screens).forEach(screen => {
    if (screen) {  // Check if screen exists before using it
      const wasActive = screen.classList.contains('active');
      screen.classList.remove('active');
      if (wasActive && screen.id) {
        console.log(`  Removed active from: ${screen.id}`);
      }
    }
  });
  
  const targetScreen = screens[screenName];
  if (targetScreen) {
    console.log(`✅ Activating screen: ${screenName} (${targetScreen.id})`);
    targetScreen.classList.add('active');
  } else {
    console.error(`❌ Screen "${screenName}" not found in screens object!`);
    console.error('Available screens:', Object.keys(screens));
    
    // Try to find screen by ID as fallback
    const screenById = document.getElementById(`${screenName}-screen`);
    if (screenById) {
      console.log(`Found screen by ID: ${screenById.id}, activating it`);
      screenById.classList.add('active');
    }
  }
  
  // Log current active screen after switch
  setTimeout(() => {
    const activeScreens = [...document.querySelectorAll('.screen.active')];
    console.log(`Active screens after switch:`, 
      activeScreens.map(s => s.id).join(', ') || 'None');
  }, 10);
}

// Start the timer
function startTimer() {
  // Reset timer state
  state.timeLeft = 100;
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
  const offset = circumference - (state.timeLeft / 100) * circumference;
  elements.timerCircle.style.strokeDashoffset = offset;
  
  // Change color based on time left (adjusted for 100 seconds)
  if (state.timeLeft <= 20) {  // Red at 20 seconds (was 10)
    elements.timerCircle.style.stroke = '#ef4444'; // Red
  } else if (state.timeLeft <= 50) {  // Orange at 50 seconds (was 30)
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
  
  // Get profile statistics
  const stats = getProfileStatistics(profileId);
  
  // Update profile card with statistics
  const statsElement = selectedCard.querySelector('.profile-difficulty') || 
                      document.createElement('p');
  if (!selectedCard.querySelector('.profile-difficulty')) {
    statsElement.className = 'profile-difficulty';
    selectedCard.appendChild(statsElement);
  }
  
  statsElement.innerHTML = `
    <span>${state.currentProfile.difficulty.charAt(0).toUpperCase() + state.currentProfile.difficulty.slice(1)} Difficulty</span><br>
    <small>Avg: ${stats.averageScore.toFixed(1)}/5 | Games: ${stats.totalGames}</small>
  `;
  
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
  
  // Save today's result and get statistics
  const stats = saveProfileResult(state.currentProfile.id, state.score);
  
  // Update statistics display (if elements exist)
  const todayScoreEl = document.getElementById('today-score');
  const averageScoreEl = document.getElementById('average-score');
  const gamesPlayedEl = document.getElementById('games-played');
  
  if (todayScoreEl) todayScoreEl.textContent = `${stats.todayScore}/5`;
  if (averageScoreEl) averageScoreEl.textContent = `${stats.averageScore.toFixed(1)}/5`;
  if (gamesPlayedEl) gamesPlayedEl.textContent = stats.totalGames;
  
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
  console.log('🚀 App initialization started');
  
  // Debug: Log all screens
  console.log('Screens object:', {
    welcome: screens.welcome ? '✅ Found' : '❌ Missing',
    profile: screens.profile ? '✅ Found' : '❌ Missing',
    question: screens.question ? '✅ Found' : '❌ Missing',
    results: screens.results ? '✅ Found' : '❌ Missing'
  });
  
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
  
  console.log(`📊 Loaded ${state.profiles.length} profiles:`, 
    state.profiles.map(p => p.name).join(', '));
  
  // If no profiles were loaded from config.js, show an error
  if (state.profiles.length === 0) {
    console.error('No profiles found. Please check config.js');
    alert('No profiles configured. Please check the config.js file.');
    return;
  }
  
  // Set current date
  elements.currentDate.textContent = formatDate();
  
  // Render profiles
  console.log('Rendering profiles...');
  renderProfiles();
  
  // Debug: Check event listeners
  console.log('Setting up event listeners...');
  
  // Event listeners
  elements.selectProfileBtn.addEventListener('click', () => {
    console.log('🎯 selectProfileBtn clicked!');
    console.log('Current profile:', state.currentProfile);
    switchScreen('profile');
  });
  
  // 2. Profile Screen -> Back to Welcome
  elements.backToWelcomeBtn.addEventListener('click', () => {
    switchScreen('welcome');
  });
  
  // 3. Profile Screen -> Start Game (Question Screen)
  elements.startGameBtn.addEventListener('click', () => {
    if (!state.currentProfile) {
      alert('Please select a profile first!');
      return;
    }
    
    console.log('Starting game for profile:', state.currentProfile.name);
    
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
  
  // 4. Question Screen -> Submit Answer
  elements.submitAnswerBtn.addEventListener('click', submitAnswer);
  
  // 5. Question Screen -> Skip Question
  elements.skipBtn.addEventListener('click', skipQuestion);
  
  // 6. Enter key to submit answer
  elements.answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitAnswer();
    }
  });
  
  // 7. Results Screen -> Play Again
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
  
  // 8. Results Screen -> New Profile
  elements.newProfileBtn.addEventListener('click', () => {
    console.log('Going back to profile selection');
    switchScreen('profile');
  });
  
  // 9. Results Screen -> Share Score
  elements.shareBtn.addEventListener('click', shareScore);
  
  // Only allow numbers in input
  elements.answerInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });
  
  console.log('✅ App initialization complete');
}

// Make switchScreen available globally for debugging
window.switchScreen = switchScreen;

// Start the app when page loads
document.addEventListener('DOMContentLoaded', init);
