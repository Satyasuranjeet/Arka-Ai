import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_wzfbphdoapxcxqauiljj",
  dirs: ["trigger"],
  maxDuration: 3600, // seconds
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
});
