// config.js - User profiles configuration
// Use window object to make variables globally accessible
window.profiles = [
  {
    id: 1,
    name: "Twat",
    icon: "👨",  // Using simple man emoji to avoid issues
    color: "#4CAF50",
    backgroundColor: "#E8F5E9",
    difficulty: "medium"
  },
  {
    id: 2,
    name: "Son of Twat",
    icon: "👦",
    color: "#2196F3",
    backgroundColor: "#E3F2FD",
    difficulty: "medium"
  }
];

// Game settings
window.gameSettings = {
  dailyQuestions: 5,
  defaultDifficulty: "medium",
  numberRange: {
    easy: { min: 10, max: 30 },
    medium: { min: 10, max: 99 },
    hard: { min: 20, max: 99 }
  }
};

console.log('config.js loaded - Profiles:', window.profiles.length);
