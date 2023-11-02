import { test, expect } from '@playwright/test';

test.describe('stuff', () => {
  test('thing', async () => {
    expect(null).toMatch(null);
  });
});
