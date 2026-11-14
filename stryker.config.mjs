/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
export default {
  testRunner: "vitest",
  vitest: {
    configFile: "vitest.config.mts",
    // `related: true` fails inside Stryker's sandbox for this repo (no related
    // tests found even when co-located `*.test.ts` imports exist). Per-test
    // coverage analysis still selects relevant tests after the dry run.
    related: false,
  },
  // Safety default: never mutate the whole tree unless the CLI passes --mutate.
  // The stop hook always supplies an explicit file list.
  mutate: [],
  reporters: ["clear-text", "progress", "json"],
  jsonReporter: {
    fileName: "reports/mutation/mutation.json",
  },
  // Informational only — the stop hook decides follow-up from survived mutants.
  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
  ignoreStatic: true,
  packageManager: "npm",
  tempDirName: "node_modules/.stryker-tmp",
  ignorePatterns: [
    "reports",
    ".cursor/hooks/state",
    "*.sqlite.db",
    "*.sqlite.db-*",
    "e2e.sqlite.db",
    "e2e.sqlite.db-*",
    "test-results",
    "playwright-report",
  ],
};
