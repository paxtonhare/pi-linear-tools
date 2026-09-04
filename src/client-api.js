/**
 * Programmatic Linear client API for other Pi packages.
 *
 * The Pi extension tools and CLI format results for humans/LLMs. This module
 * exposes the underlying Linear access layer so other packages can build their
 * own typed domain objects without shelling out or parsing markdown.
 */

import { createLinearClient } from './linear-client.js';
import {
  fetchIssueDetails,
  fetchIssueImages,
  fetchIssueActivity,
} from './linear.js';
import { loadSettings } from './settings.js';
import { getAccessToken } from './auth/index.js';

function cleanToken(value) {
  const token = String(value || '').trim();
  return token.startsWith('Bearer ') ? token.slice('Bearer '.length).trim() : token;
}

/**
 * Resolve Linear authentication using the same precedence as the Pi extension.
 *
 * @returns {Promise<{apiKey?: string, accessToken?: string}>}
 */
export async function resolveLinearAuth() {
  const envKey = cleanToken(process.env.LINEAR_API_KEY);
  if (envKey) return { apiKey: envKey };

  const envToken = cleanToken(process.env.LINEAR_API_TOKEN);
  if (envToken) return { apiKey: envToken };

  const settings = await loadSettings();
  const authMethod = settings.authMethod || 'api-key';

  if (authMethod === 'oauth') {
    const accessToken = cleanToken(await getAccessToken());
    if (accessToken) return { accessToken };
  }

  const apiKey = cleanToken(settings.apiKey || settings.linearApiKey);
  if (apiKey) return { apiKey };

  const fallbackAccessToken = cleanToken(await getAccessToken());
  if (fallbackAccessToken) return { accessToken: fallbackAccessToken };

  throw new Error('No Linear authentication configured. Use /linear-tools-config --api-key <key> or run `pi-linear-tools auth login`.');
}

/**
 * Create an authenticated Linear SDK client.
 *
 * @param {{apiKey?: string, accessToken?: string}|string|undefined} auth
 */
export async function createAuthenticatedLinearClient(auth = undefined) {
  if (auth) {
    if (typeof auth === 'string') return createLinearClient(cleanToken(auth));
    if (auth.apiKey) return createLinearClient({ ...auth, apiKey: cleanToken(auth.apiKey) });
    if (auth.accessToken) return createLinearClient({ ...auth, accessToken: cleanToken(auth.accessToken) });
    return createLinearClient(auth);
  }
  return createLinearClient(await resolveLinearAuth());
}

/**
 * Fetch structured Linear issue context.
 *
 * @param {string} issueRef Linear issue key (ABC-123), URL-normalized key, or ID.
 * @param {{client?: unknown, auth?: {apiKey?: string, accessToken?: string}|string, includeComments?: boolean}} options
 */
export async function getLinearIssueContext(issueRef, options = {}) {
  const client = options.client || await createAuthenticatedLinearClient(options.auth);
  return fetchIssueDetails(client, issueRef, {
    includeComments: options.includeComments !== false,
  });
}

/**
 * Fetch image references embedded in a Linear issue/comments.
 */
export async function getLinearIssueImages(issueRef, options = {}) {
  const client = options.client || await createAuthenticatedLinearClient(options.auth);
  return fetchIssueImages(client, issueRef, options);
}

/**
 * Fetch Linear issue activity entries.
 */
export async function getLinearIssueActivity(issueRef, options = {}) {
  const client = options.client || await createAuthenticatedLinearClient(options.auth);
  return fetchIssueActivity(client, issueRef, options);
}
