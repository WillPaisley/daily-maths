javascript
// Seeded random number generator (mulberry32)
function createRng(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Convert date string to numeric seed
function dateToSeed(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Generate a single question
function generateQuestion(rng) {
  const ops = ['+', '-', '×', '÷'];
  const op = ops[Math.floor(rng() * ops.length)];
 
  let a, b, answer;
 
  switch (op) {
    case '+':
      a = Math.floor(rng() * 90) + 10;  // 10-99
      b = Math.floor(rng() * 90) + 10;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(rng() * 90) + 10;
      b = Math.floor(rng() * a);        // ensure positive result
      answer = a - b;
      break;
    case '×':
      a = Math.floor(rng() * 12) + 2;   // 2-13
      b = Math.floor(rng() * 12) + 2;
      answer = a * b;
      break;
    case '÷':
      b = Math.floor(rng() * 11) + 2;   // 2-12
      answer = Math.floor(rng() * 12) + 2;
      a = b * answer;                   // ensure clean division
      break;
  }
 
  return { text: `${a} ${op} ${b} =`, answer };
}

// Generate today's questions
function generateDailyQuestions() {
  const today = new Date().toISOString().slice(0, 10);
  const seed = dateToSeed(today);
  const rng = createRng(seed);
 
  const questions = [];
  for (let i = 0; i < 5; i++) {
    questions.push(generateQuestion(rng));
  }
  return { date: today, questions };
}

// Render questions to DOM
function renderQuestions(questions) {
  const container = document.getElementById('questions');
  container.innerHTML = questions.map((q, i) => `
    <div class="question">
      <span>${q.text}</span>
      <input type="number" id="answer-${i}" autocomplete="off" required>
    </div>
  `).join('');
}

// Check answers and show score
function checkAnswers(questions) {
  let score = 0;
 
  questions.forEach((q, i) => {
    const input = document.getElementById(`answer-${i}`);
    const userAnswer = parseInt(input.value, 10);
   
    if (userAnswer === q.answer) {
      score++;
      input.classList.add('correct');
    } else {
      input.classList.add('incorrect');
      // Show correct answer
      const reveal = document.createElement('span');
      reveal.className = 'answer-reveal';
      reveal.textContent = `(${q.answer})`;
      input.parentElement.appendChild(reveal);
    }
    input.disabled = true;
  });
 
  document.getElementById('score').textContent = score;
  document.getElementById('message').textContent = getMessage(score);
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('submit-btn').disabled = true;
}

function getMessage(score) {
  if (score === 5) return '🎉 Perfect! You\'re a math wizard!';
  if (score >= 3) return '👍 Nice work! Keep practicing!';
  return '💪 Keep at it! Try again tomorrow!';
}

// Initialize
const { date, questions } = generateDailyQuestions();

document.getElementById('date').textContent = new Date(date).toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

renderQuestions(questions);

document.getElementById('quiz-form').addEventListener('submit', (e) => {
  e.preventDefault();
  checkAnswers(questions);
});
