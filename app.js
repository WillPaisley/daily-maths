// App state
const state = {
  currentQuestion: 0,
  score: 0,
  userAnswers: [],
  questions: [],
  selectedOption: null,
  currentProfile: null,
  profiles: [],
  gameSettings: null
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
  optionsContainer: document.getElementById('options-container'),
  submitBtn: document.getElementById('submit-btn'),
  nextBtn: document.getElementById('next-btn'),
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
  resultsProfileIcon: document.getElementById('results-profile-icon')
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
  
  const options = [correctAnswer];
  while (options.length < 4) {
    const offset = Math.floor(correctAnswer * (rng() * 0.4 - 0.2));
    const wrongAnswer = correctAnswer + offset;
    
    if (wrongAnswer !== correctAnswer && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  shuffleArray(options, rng);
  
  return {
    question: `${a} × ${b} = ?`,
    correctAnswer: correctAnswer,
    options: options,
    correctIndex: options.indexOf(correctAnswer),
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
  
  const options = [correctAnswer];
  while (options.length < 4) {
    let wrongAnswer;
    if (rng() > 0.5) {
      wrongAnswer = Math.floor(dividend / (divisor + Math.floor(rng() * 10 - 5)));
    } else {
      wrongAnswer = correctAnswer + Math.floor(rng() * 20 - 10);
    }
    
    if (wrongAnswer > 0 && wrongAnswer !== correctAnswer && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  shuffleArray(options, rng);
  
  return {
    question: `${dividend} ÷ ${divisor} = ?`,
    correctAnswer: correctAnswer,
    options: options,
    correctIndex: options.indexOf(correctAnswer),
    type: 'division'
  };
}

// Fisher-Yates shuffle
function shuffleArray(array, rng) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
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
  
  // Clear and render options
  elements.optionsContainer.innerHTML = '';
  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.textContent = option.toLocaleString();
    button.dataset.index = index;
    
    button.addEventListener('click', () => selectOption(index, button));
    
    elements.optionsContainer.appendChild(button);
  });
  
  // Reset selection
  state.selectedOption = null;
  elements.submitBtn.disabled = true;
  elements.nextBtn.classList.add('hidden');
  
  // Clear any existing selection styles
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
}

// Select an option
function selectOption(index, button) {
  // Clear previous selection
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // Mark selected option
  button.classList.add('selected');
  state.selectedOption = index;
  elements.submitBtn.disabled = false;
}

// Submit answer
function submitAnswer() {
  if (state.selectedOption === null) return;
  
  const question = state.questions[state.currentQuestion];
  const isCorrect = state.selectedOption === question.correctIndex;
  
  // Update score
  if (isCorrect) {
    state.score++;
  }
  
  // Store user answer
  state.userAnswers.push({
    question: question.question,
    userAnswer: question.options[state.selectedOption],
    correctAnswer: question.correctAnswer,
    isCorrect: isCorrect,
    selectedIndex: state.selectedOption,
    type: question.type
  });
  
  // Show correct/incorrect styling
  document.querySelectorAll('.option-btn').forEach((btn, index) => {
    if (index === question.correctIndex) {
      btn.classList.add('correct');
    } else if (index === state.selectedOption && !isCorrect) {
      btn.classList.add('incorrect');
    }
    btn.disabled = true;
  });
  
  // Show next button
  elements.nextBtn.classList.remove('hidden');
  elements.submitBtn.disabled = true;
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
    
    resultDiv.innerHTML = `
      <div class="question-type ${difficultyClass}">${typeIcon}</div>
      <div class="question-content">
        <div class="question-text">Q${index + 1}: ${result.question}</div>
        <div class="question-answer">
          ${result.isCorrect ? '✓' : '✗'} 
          ${result.isCorrect ? 'Correct!' : `You chose ${result.userAnswer}, correct was ${result.correctAnswer}`}
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
  state.selectedOption = null;
  
  // Generate new questions for current profile
  if (state.currentProfile) {
    state.questions = generateDailyQuestions(state.currentProfile);
  }
}

// Initialize app
function init() {
  // Load profiles and settings from config.js
  // These are defined in config.js which is loaded before app.js
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
  
  elements.submitBtn.addEventListener('click', submitAnswer);
  elements.nextBtn.addEventListener('click', nextQuestion);
  
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
