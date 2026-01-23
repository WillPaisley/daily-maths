// App state
const state = {
  currentQuestion: 0,
  score: 0,
  userAnswers: [],
  questions: [],
  selectedOption: null
};

// DOM Elements
const screens = {
  welcome: document.getElementById('welcome-screen'),
  question: document.getElementById('question-screen'),
  results: document.getElementById('results-screen')
};

const elements = {
  currentDate: document.getElementById('current-date'),
  startBtn: document.getElementById('start-btn'),
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
  shareBtn: document.getElementById('share-btn'),
  scoreCircle: document.getElementById('score-circle')
};

// Seed-based random number generator
function createSeededRandom(seed) {
  return function() {
    seed = Math.sin(seed) * 10000;
    return seed - Math.floor(seed);
  };
}

// Generate multiplication question
function generateMultiplication(rng) {
  // Generate two numbers between 10 and 99
  const a = Math.floor(rng() * 90) + 10;
  const b = Math.floor(rng() * 90) + 10;
  const correctAnswer = a * b;
  
  // Generate 3 wrong answers
  const options = [correctAnswer];
  while (options.length < 4) {
    // Generate plausible wrong answers (±10-30% of correct answer)
    const offset = Math.floor(correctAnswer * (rng() * 0.4 - 0.2));
    const wrongAnswer = correctAnswer + offset;
    
    // Ensure it's different from correct answer and other wrong answers
    if (wrongAnswer !== correctAnswer && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // Shuffle options
  shuffleArray(options, rng);
  
  return {
    question: `${a} × ${b} = ?`,
    correctAnswer: correctAnswer,
    options: options,
    correctIndex: options.indexOf(correctAnswer)
  };
}

// Generate division question
function generateDivision(rng) {
  // Generate two numbers between 10 and 99
  const divisor = Math.floor(rng() * 90) + 10;
  const quotient = Math.floor(rng() * 90) + 10;
  const dividend = divisor * quotient;
  const correctAnswer = quotient;
  
  // Generate 3 wrong answers
  const options = [correctAnswer];
  while (options.length < 4) {
    // Generate plausible wrong answers
    let wrongAnswer;
    if (rng() > 0.5) {
      wrongAnswer = Math.floor(dividend / (divisor + Math.floor(rng() * 10 - 5)));
    } else {
      wrongAnswer = correctAnswer + Math.floor(rng() * 20 - 10);
    }
    
    // Ensure positive, different, and plausible
    if (wrongAnswer > 0 && wrongAnswer !== correctAnswer && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // Shuffle options
  shuffleArray(options, rng);
  
  return {
    question: `${dividend} ÷ ${divisor} = ?`,
    correctAnswer: correctAnswer,
    options: options,
    correctIndex: options.indexOf(correctAnswer)
  };
}

// Fisher-Yates shuffle
function shuffleArray(array, rng) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Generate today's questions
function generateDailyQuestions() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const seed = Array.from(today).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rng = createSeededRandom(seed);
  
  const questions = [];
  for (let i = 0; i < 5; i++) {
    // Alternate between multiplication and division
    if (i % 2 === 0) {
      questions.push(generateMultiplication(rng));
    } else {
      questions.push(generateDivision(rng));
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

// Render current question
function renderQuestion() {
  const question = state.questions[state.currentQuestion];
  
  // Update progress
  elements.currentQuestion.textContent = state.currentQuestion + 1;
  elements.progressFill.style.width = `${((state.currentQuestion) / 5) * 100}%`;
  
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
    selectedIndex: state.selectedOption
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
  // Update final score
  elements.finalScore.textContent = state.score;
  
  // Calculate percentage for circle animation
  const percentage = (state.score / 5) * 100;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (percentage / 100) * circumference;
  
  // Animate score circle
  setTimeout(() => {
    elements.scoreCircle.style.strokeDashoffset = offset;
    document.querySelector('.score-percent').textContent = `${percentage}%`;
  }, 100);
  
  // Show question results
  elements.resultDetails.innerHTML = '';
  state.userAnswers.forEach((result, index) => {
    const resultDiv = document.createElement('div');
    resultDiv.className = `question-result ${result.isCorrect ? 'correct' : 'incorrect'}`;
    
    resultDiv.innerHTML = `
      <div class="question-text">Q${index + 1}: ${result.question}</div>
      <div class="question-answer">
        ${result.isCorrect ? '✓' : '✗'} 
        ${result.isCorrect ? 'Correct!' : `You chose ${result.userAnswer}, correct was ${result.correctAnswer}`}
      </div>
    `;
    
    elements.resultDetails.appendChild(resultDiv);
  });
  
  // Show encouragement message
  let message = '';
  if (state.score === 5) {
    message = '🎉 Perfect score! You are a math genius! 🧠';
  } else if (state.score >= 4) {
    message = '🌟 Excellent work! You\'re really good at this!';
  } else if (state.score >= 3) {
    message = '👍 Good job! Keep practicing to get even better!';
  } else {
    message = '💪 Every challenge makes you stronger. Try again tomorrow!';
  }
  elements.encouragementMessage.textContent = message;
  
  // Switch to results screen
  switchScreen('results');
}

// Share score
function shareScore() {
  const shareText = `I scored ${state.score}/5 on the Daily Mental Math Challenge! 🧮\n\nTry it yourself: ${window.location.href}`;
  
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

// Initialize app
function init() {
  // Set current date
  elements.currentDate.textContent = formatDate();
  
  // Generate questions
  state.questions = generateDailyQuestions();
  
  // Event listeners
  elements.startBtn.addEventListener('click', () => {
    switchScreen('question');
    renderQuestion();
  });
  
  elements.submitBtn.addEventListener('click', submitAnswer);
  elements.nextBtn.addEventListener('click', nextQuestion);
  
  elements.restartBtn.addEventListener('click', () => {
    // Reset state
    state.currentQuestion = 0;
    state.score = 0;
    state.userAnswers = [];
    state.selectedOption = null;
    
    // Regenerate questions (new day = new questions)
    state.questions = generateDailyQuestions();
    
    // Reset UI
    elements.progressFill.style.width = '20%';
    elements.scoreCircle.style.strokeDashoffset = '339.292';
    document.querySelector('.score-percent').textContent = '0%';
    
    // Switch back to welcome screen
    switchScreen('welcome');
  });
  
  elements.shareBtn.addEventListener('click', shareScore);
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', init);
