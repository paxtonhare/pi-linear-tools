#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function main() {
  const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf-8'));
  assert.equal(packageJson.exports['./client'], './src/client-api.js');

  const api = await import('../src/client-api.js');
  assert.equal(typeof api.resolveLinearAuth, 'function');
  assert.equal(typeof api.createAuthenticatedLinearClient, 'function');
  assert.equal(typeof api.getLinearIssueContext, 'function');
  assert.equal(typeof api.getLinearIssueImages, 'function');
  assert.equal(typeof api.getLinearIssueActivity, 'function');

  console.log('✓ tests/test-client-api.js passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
