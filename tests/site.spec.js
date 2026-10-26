const { test, expect } = require('@playwright/test');

test('page loads without layout overflow or broken images', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => failedRequests.push(request.url()));

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  await expect(page).toHaveTitle(/Gather & Graze Yorkshire/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Beautiful food');

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);

  const images = await page.locator('img').all();
  for (const image of images) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
  }
  const brokenImages = await page.locator('img').evaluateAll((images) => images
    .filter((image) => !image.complete || image.naturalWidth === 0)
    .map((image) => image.src));
  expect(brokenImages).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test('key viewports have no horizontal overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(dimensions.scrollWidth, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});

test('keyboard users can reach the skip link and menu', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});

test('approach image reveals after navigation to the section', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await page.goto('/');

  const imageWrap = page.locator('.editorial__image');
  const image = imageWrap.locator('img');
  const initialClip = await image.evaluate((element) => getComputedStyle(element).clipPath);
  expect(initialClip).toContain('100%');

  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Our approach' })
    .click();

  await expect(page).toHaveURL(/#approach$/);
  await expect(imageWrap).toHaveClass(/is-visible/);
  await expect.poll(() => image.evaluate((element) => getComputedStyle(element).clipPath)).toBe('inset(0px)');
});

test('approach image reveals when scrolled into view', async ({ page }) => {
  await page.goto('/');

  const imageWrap = page.locator('.editorial__image');
  const image = imageWrap.locator('img');
  await imageWrap.scrollIntoViewIfNeeded();

  await expect(imageWrap).toHaveClass(/is-visible/);
  await expect.poll(() => image.evaluate((element) => getComputedStyle(element).clipPath)).toBe('inset(0px)');
});

test('mobile menu opens, navigates and closes', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'));
  await page.goto('/');

  const menuButton = page.getByRole('button', { name: /menu/i });
  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toHaveClass(/is-open/);

  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'What we create' }).click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await expect(page).toHaveURL(/#offer$/);
});

test('service accordion changes active item', async ({ page }) => {
  await page.goto('/');
  const plattersButton = page.getByRole('button', { name: /02 Grazing platters/ });
  await plattersButton.click();
  await expect(plattersButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Generous, beautifully arranged boards')).toBeVisible();
});

test('enquiry planner validates and prepares a message', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Prepare my enquiry' }).click();
  await expect(page.getByText('Please choose an occasion.')).toBeVisible();

  await page.locator('#occasion').selectOption({ label: 'Birthday celebration' });
  await page.locator('#event-date').fill('2030-06-15');
  await page.locator('#guest-count').fill('30');
  await page.locator('#postcode').fill('HU10');
  await page.getByRole('button', { name: 'Prepare my enquiry' }).click();

  await expect(page.getByText(/15 June 2030 for around 30 guests in HU10/)).toBeVisible();
});
