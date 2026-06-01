import { task, logger } from "@trigger.dev/sdk/v3";

/**
 * Simple test task — run this from the Trigger.dev dashboard to verify the setup.
 */
export const helloWorld = task({
  id: "hello-world",
  run: async (payload: { message?: string }) => {
    logger.log("Hello from ProjectOne!", { payload });
    return {
      success: true,
      echo: payload.message ?? "No message provided",
    };
  },
});
