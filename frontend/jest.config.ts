import type { Config } from 'jest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'jsonc-parser';
import { pathsToModuleNameMapper } from 'ts-jest';

// Read tsconfig.json to get path mappings
const tsconfig = parse(
  readFileSync(join(__dirname, 'tsconfig.json'), 'utf-8'),
);

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
    '^.+\\.svg$': '<rootDir>/svgTransform.js',
    '^.+\\.(t|j)sx?$': [
      'babel-jest',
      {
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                node: 'current',
              },
            },
          ],
          '@babel/preset-react',
          '@babel/preset-typescript',
        ],
        plugins: [
          ['babel-plugin-transform-import-meta', { module: 'ES6' }],
          ['babel-plugin-transform-vite-meta-env'],
        ],
      },
    ],
  },

  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  moduleNameMapper: {
    // Map path aliases from tsconfig
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    // Handle CSS imports (if needed)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '**/src/**/*.{spec,test}.{ts,tsx}',
    '**/packages/**/*.{spec,test}.{ts,tsx}',
    '**/packages/**/*-test.{ts,tsx}',
  ],
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
