import type { Config } from 'jest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathsToModuleNameMapper } from 'ts-jest';

// Read tsconfig.json to get path mappings
const tsconfig = JSON.parse(
  readFileSync(join(__dirname, 'tsconfig.json'), 'utf-8'),
);

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.svg$': '<rootDir>/svgTransform.js',
  },
  moduleNameMapper: {
    // Map path aliases from tsconfig
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    // Handle CSS imports (if needed)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.{spec,test}.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

export default config;
