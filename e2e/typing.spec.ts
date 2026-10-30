import { test, expect, type Page } from '@playwright/test';

/** Types every word on screen. `?duration=3` on the URL makes the 15s test end after 3 seconds. */
async function typeShownWords(page: Page) {
  await expect(page.getByTestId('word').first()).toBeVisible();
  const words = (await page.getByTestId('word').allTextContents()).map((word) => word.trim());
  await page.getByTestId('typing-area').click();
  await page.keyboard.type(words.join(' '));
}

test('seeds five demo scores on the first visit', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Typing Speed');
  await expect(page.getByTestId('leaderboard-row')).toHaveCount(5);
});

test('finishes a 15s test and shows the results and the leaderboard entry', async ({ page }) => {
  await page.goto('/?duration=3');
  await typeShownWords(page);

  await expect(page.getByTestId('results')).toBeVisible();
  await expect(page.getByTestId('wpm')).toBeVisible();
  await expect(page.getByTestId('accuracy')).toHaveText(/%$/);
  await expect(page.getByTestId('wpm-chart')).toBeVisible();

  await expect(page.getByTestId('leaderboard-row')).toHaveCount(6);
  const newest = page.getByTestId('leaderboard-row').first();
  await expect(newest.getByTestId('mode-15')).toBeVisible();
});

test('Tab then Enter on the results screen starts a new test', async ({ page }) => {
  await page.goto('/?duration=3');
  await typeShownWords(page);
  await expect(page.getByTestId('results')).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByTestId('try-again')).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByTestId('results')).toBeHidden();
  await expect(page.getByTestId('live-wpm')).toBeVisible();
  await expect(page.getByTestId('typing-input')).toBeFocused();
});

test('a wrong key shows as wrong until backspace clears it', async ({ page }) => {
  await page.goto('/');
  const firstWord = (await page.getByTestId('word').first().textContent())!.trim();
  const wrongKey = firstWord[0] === 'z' ? 'q' : 'z';

  await page.getByTestId('typing-area').click();
  await page.keyboard.type(wrongKey);
  await expect(page.locator('[data-index="0"]')).toHaveAttribute('data-state', 'wrong');

  await page.keyboard.press('Backspace');
  await expect(page.locator('[data-index="0"]')).toHaveAttribute('data-state', 'upcoming');

  await page.keyboard.type(firstWord[0]);
  await expect(page.locator('[data-index="0"]')).toHaveAttribute('data-state', 'correct');
  // One wrong keystroke and one correct keystroke: 50% accuracy, backspace does not count.
  await expect(page.getByTestId('live-accuracy')).toHaveText('50%');
});

test('switching duration and content restarts the test', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('mode-option-30').click();
  await page.getByTestId('content-code').click();

  await expect(page.getByTestId('mode-option-30')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('content-code')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('time-left')).toHaveText('30s');
});

test('fits a 390px wide phone without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByTestId('text')).toBeVisible();

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});
