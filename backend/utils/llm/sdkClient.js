// Central loader for the official OpenRouter SDK client.
// @openrouter/sdk is published as ESM only, so it is loaded lazily via dynamic import
// and shared as a singleton across the CommonJS backend.

let clientPromise = null;

/**
 * Returns the shared OpenRouter SDK client instance.
 * @returns {Promise<import("@openrouter/sdk").OpenRouter>}
 */
async function getOpenRouterClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not defined in environment variables");
  }

  if (!clientPromise) {
    clientPromise = import("@openrouter/sdk").then(
      ({ OpenRouter }) =>
        new OpenRouter({
          apiKey: process.env.OPENROUTER_API_KEY,
          httpReferer: process.env.OPENROUTER_APP_URL,
          appTitle: process.env.OPENROUTER_APP_TITLE,
        })
    );
    // Do not cache a rejected client promise (e.g. after a transient load failure)
    clientPromise.catch(() => {
      clientPromise = null;
    });
  }

  return clientPromise;
}

/**
 * Drops the cached client instance (mainly useful for tests).
 */
function resetOpenRouterClient() {
  clientPromise = null;
}

module.exports = { getOpenRouterClient, resetOpenRouterClient };
