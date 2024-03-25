/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__test__/**/*.test.ts'],
  coverageProvider: 'v8',
  collectCoverage: true,
  setupFiles: ["<rootDir>/src/__test__/setup.ts"],
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: [
    "node_modules",
    "<rootDir>/src/__test__/*.helper.test.ts",
    "<rootDir>/src/env.ts",
    "<rootDir>/src/index.ts",
    "<rootDir>/src/interface.ts",
    "<rootDir>/src/secrets.interface.ts",
    "<rootDir>/src/bot.ts",
  ]
};