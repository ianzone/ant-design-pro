import { expect, type FullConfig, request } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  const context = await request.newContext({
    baseURL: config.projects[0].use.baseURL,
    timeout: 5_000,
  });

  try {
    // Umi serves its Bundling page with HTTP 200 before compilation finishes.
    await expect
      .poll(
        async () => {
          const response = await context.get('/__umi/api/bundle-status');
          if (!response.ok()) return false;

          const { bundleStatus, mfsuBundleStatus } = await response.json();
          return (
            bundleStatus?.done === true &&
            (!mfsuBundleStatus || mfsuBundleStatus.done === true)
          );
        },
        { timeout: 120_000, message: 'Wait for Umi compilation to finish' },
      )
      .toBe(true);
  } finally {
    await context.dispose();
  }
}
