import { expect, type Page } from '@playwright/test';

export function watchPage(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('response', (res) => {
    const url = res.url();
    if (res.status() < 400) return;
    if (!url.startsWith('http://127.0.0.1') && !url.startsWith('http://localhost')) return;
    if (url.includes('favicon')) return;
    errors.push(`${res.status()} ${url}`);
  });
  return errors;
}

export async function goHash(page: Page, hash: string) {
  await page.evaluate((value) => {
    const next = value.startsWith('#') ? value : `#${value}`;
    if (window.location.hash !== next) window.location.hash = next;
  }, hash);
  await page.waitForTimeout(250);
}

export async function signIn(page: Page, who: 'student' | 'teacher') {
  await page.goto('/');
  await page.getByTestId(who === 'teacher' ? 'e2e-teacher' : 'e2e-student').click();
  await expect(page.getByTestId('step-title')).toBeVisible();
}

export async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'page is wider than the viewport').toBeLessThanOrEqual(2);
}

export async function clickCoach(page: Page) {
  const title = ((await page.getByTestId('step-title').textContent()) || '').trim();
  const ring = page.getByTestId('coach-ring');
  await expect(ring, `no guide mark on “${title}”`).toBeVisible({ timeout: 8000 });
  const box = await ring.boundingBox();
  expect(box, 'guide arrow has no box').toBeTruthy();
  expect(box!.width).toBeGreaterThan(8);
  expect(box!.height).toBeGreaterThan(8);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual((page.viewportSize()?.height ?? 800) + 120);
  const ids = ((await page.getByTestId('step-title').getAttribute('data-coaches')) || '').split(' ').filter(Boolean);
  let clicked = false;
  for (const id of ids) {
    const target = page.locator(`[data-coach="${id}"]`).first();
    if (await target.isVisible().catch(() => false)) {
      const inHeader = await target.evaluate((el) => !!el.closest('header'));
      if (!inHeader) await target.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
      const targetBox = await target.boundingBox();
      expect(targetBox, `${id} is not on screen`).toBeTruthy();
      expect(targetBox!.y).toBeGreaterThanOrEqual(-2);
      expect(targetBox!.y + targetBox!.height).toBeGreaterThan(0);
      if (inHeader) await target.evaluate((el) => (el as HTMLElement).click());
      else await target.click({ timeout: 1500 }).catch(() => target.evaluate((el) => (el as HTMLElement).click()));
      clicked = true;
      break;
    }
  }
  expect(clicked, `no visible target for ${ids.join(', ')}`).toBeTruthy();
}

export async function dismissBubble(page: Page) {
  const gotIt = page.getByRole('button', { name: /Got it/ });
  await expect(gotIt).toBeVisible();
  await gotIt.click();
}

/** Follow the highlighted control until the named step title is showing, then stop before leaving it. */
export async function followGuideUntil(page: Page, stopTitle: string) {
  let last = '';
  let stuck = 0;
  let title = '';
  for (let i = 0; i < 160; i++) {
    title = (await page.getByTestId('step-title').innerText()).trim();
    if (title === stopTitle) return;
    if (await page.getByRole('button', { name: /Got it/ }).isVisible().catch(() => false)) {
      await dismissBubble(page);
      stuck = 0;
      continue;
    }
    const coachNow = await page.locator('[data-coach]').evaluateAll((els) =>
      els
        .filter((el) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          return r.width > 2 && r.height > 2;
        })
        .map((el) => el.getAttribute('data-coach'))
        .join('|')
    );
    const signature = `${title}|${coachNow}`;
    if (signature === last) stuck += 1;
    else stuck = 0;
    last = signature;
    expect(stuck, `stuck on “${title}”`).toBeLessThan(8);
    const complete = await page.getByTestId('step-title').getAttribute('data-complete');
    if (complete === 'next') {
      const next = page.locator('[data-coach="guide-next"]');
      await next.click({ timeout: 4000 }).catch(async () => {
        await page.keyboard.press('Escape');
        await next.click({ force: true });
      });
    } else if (complete === 'search-used') {
      await page.getByPlaceholder(/Search modules/i).fill('Paper');
    } else {
      await clickCoach(page);
    }
    await page.waitForTimeout(350);
  }
  throw new Error(`never reached “${stopTitle}” (stuck on “${title}”)`);
}

export async function followGuideToEnd(page: Page) {
  await followGuideUntil(page, 'You finished the class');
  if (!(await page.getByRole('button', { name: /Got it/ }).isVisible().catch(() => false))) {
    await page.locator('[data-coach="guide-next"]').click();
  }
  await expect(page.getByRole('button', { name: /Got it/ })).toBeVisible();
}
