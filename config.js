// config.js - User profiles configuration
const profiles = [
  {
    id: 1,
    name: "Twat",
    icon: "👨‍🦳",  // Fixed: Man with beard emoji
    color: "#4CAF50",
    backgroundColor: "#E8F5E9",
    difficulty: "medium"
  },
  {
    id: 2,
    name: "Son of Twat",
    icon: "👦",  // Boy emoji
    color: "#2196F3",
    backgroundColor: "#E3F2FD",
    difficulty: "medium"
  }
];

// Game settings
const gameSettings = {
  dailyQuestions: 5,
  defaultDifficulty: "medium",
  numberRange: {
    easy: { min: 10, max: 30 },
    medium: { min: 10, max: 99 },
    hard: { min: 20, max: 99 }
  }
};
