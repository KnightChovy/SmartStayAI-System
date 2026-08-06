module.exports = {
  testEnvironment: 'node',
  restoreMocks: true,
  // Chạy bộ test MỚI của luồng booking (viết bằng JS, require code đã build ở dist/) — tránh hố
  // phụ thuộc ts-jest vs TypeScript 6. Bộ test boilerplate cũ (tests/integration, tests/unit/models…)
  // viết cho Mongoose đã hỏng nên KHÔNG nằm trong phạm vi chạy.
  testMatch: ['**/tests/booking/**/*.test.js'],
  coveragePathIgnorePatterns: ['node_modules', 'src/config', 'tests'],
  coverageReporters: ['text', 'lcov'],
};
