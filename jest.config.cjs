/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testPathIgnorePatterns: ["node_modules", "dist", ".yarn", ".pnp*", "coverage",],

  globals: {
    __DEV__: true,
  },

  testMatch: [
    "**/__tests__/**/*.+(ts|js)",
    "**/tests/**/?(*.)+(spec|test).+(ts|js)",
    "**/?(*.)+(spec|test).+(ts|js)",
  ],

  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  roots: ['<rootDir>'],

  transform: {
    '.ts': [
      'ts-jest',
      {
        tsconfig: './tsconfig.jest.json'
      }
    ],
  }
}
