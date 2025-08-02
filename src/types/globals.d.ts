// Ensure this file is picked up by TypeScript for global type augmentation.
// Adds a typed flag we can use to remember that the Gemini daily quota
// has been exhausted so we can immediately fall back to the local model.
//
// You don’t need to import this file anywhere—just keep it inside the
// `src` or `types` directory so it’s included by `tsconfig.json`.

export {};

declare global {
  // Available on both the browser and Node runtimes via `globalThis`.
  // `undefined` means we haven’t seen a 429 yet.
  var geminiQuotaExceeded: boolean | undefined;
} 