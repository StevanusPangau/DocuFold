import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'out/test/**/*.test.js',
  workspaceFolder: './test-workspace',
  mocha: {
    ui: 'tdd',
    timeout: 20000,
    color: true,
    reporter: 'spec',
  },
  coverage: {
    reporter: ['text', 'html', 'lcov'],
    exclude: ['**/node_modules/**', '**/out/test/**', '**/*.test.js', '**/*.spec.js'],
  },
});
