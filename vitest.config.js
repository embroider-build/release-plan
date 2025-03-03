import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      // you can include other reporters, but 'json-summary' is required, json is recommended
      reporter: ['text', 'html', 'clover', 'json', 'json-summary'],
    },
  },
});
