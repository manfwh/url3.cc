module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    rootDir: '.',
  
    transform: {
      '^.+\\.(ts|tsx)$': ['ts-jest', {
        tsconfig: '<rootDir>/tsconfig.json',
        isolatedModules: true
      }]
    },
  
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
    testMatch: [
      '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
      '<rootDir>/src/**/__tests__/**/*.{ts,tsx}'
    ],
  
    testPathIgnorePatterns: [
      '<rootDir>/node_modules/',
      '<rootDir>/dist/',
      '<rootDir>/coverage/',
      '<rootDir>/e2e/',
      '<rootDir>/build/'
    ],
  
    modulePathIgnorePatterns: [
      '<rootDir>/dist/',
      '<rootDir>/build/',
      '<rootDir>/coverage/'
    ],
  
    setupFilesAfterEnv: [
      '@testing-library/jest-dom',
      '<rootDir>/src/setupTests.ts'
    ],
  
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      '\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/src/__mocks__/fileMock.js',
      '^@/(.*)$': '<rootDir>/src/$1'
    },
  
    collectCoverage: true,
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.stories.{ts,tsx}',
      '!src/**/__tests__/**',
      '!src/**/__mocks__/**',
      '!src/**/index.{ts,tsx}'
    ],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
  
    maxWorkers: '50%',
    
    verbose: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
