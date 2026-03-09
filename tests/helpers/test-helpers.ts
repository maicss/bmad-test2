/**
 * Test Helpers
 *
 * Helper functions for creating test data
 */

import { createFamily as _createFamily, createParent as _createParent, createChild as _createChild } from '../../lib/db/test-utils';
import { createTask } from '../../lib/db/queries/tasks';

export async function createFamily() {
  return await _createFamily();
}

export async function createParent(options: { familyId: string }) {
  return await _createParent(options);
}

export async function createChild(options: { familyId: string }) {
  return await _createChild(options);
}

export { createTask };
