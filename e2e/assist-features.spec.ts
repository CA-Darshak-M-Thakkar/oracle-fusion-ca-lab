import { expect, test, type Page } from '@playwright/test';
import { signIn } from './helpers';

const SAMPLE = ['ori-erp', 'p2p-cart', 'o2c-so', 'gl-tb', 'aud-91'] as const;

async function targetBox(page: Page) {
  return page.evaluate(() => {
    const layer = document.querySelector('[data-testid="assist-layer"]');
    const id = layer?.getAttribute('data-target');
    const target = id ? document.querySelector(`[data-coach="${id}"]`) : null;
    const end = document.querySelector('[data-testid="assist-long-arrow-end"]');
    if (!target || !end) return null;
    const box = target.getBoundingClientRect();
    const cx = Number(end.getAttribute('cx'));
    const cy = Number(end.getAttribute('cy'));
    return {
      id,
      inside: cx >= box.left - 4 && cx <= box.right + 4 && cy >= box.top - 4 && cy <= box.bottom + 4,
      cx,
      cy,
      box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom },
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('new assist guides on day 0 and all four labs', async ({ page }) => {
  await signIn(page, 'teacher');
  await expect(page.getByTestId('assist-opt-long-arrow')).toBeChecked();
  await expect(page.getByTestId('assist-speaker')).toHaveAttribute('aria-pressed', 'false');
  await page.getByText('More guides').click();
  await expect(page.getByTestId('assist-step-count')).toHaveText('Step 1 of 45');
  await expect.poll(async () => (await targetBox(page))?.inside).toBeTruthy();

  const shot = async (name: string, only: string) => {
    for (const id of ['assist-opt-long-arrow', 'assist-opt-hand', 'assist-opt-feedback', 'assist-opt-dim', 'assist-opt-counter', 'assist-opt-magnifier']) {
      await page.getByTestId(id).setChecked(id === only);
    }
    await expect(page.getByTestId(only)).toBeChecked();
    await page.screenshot({ path: `test-results/${name}.png` });
  };
  await shot('feature-long-arrow', 'assist-opt-long-arrow');
  await shot('feature-hand', 'assist-opt-hand');
  await shot('feature-dim', 'assist-opt-dim');
  await shot('feature-counter', 'assist-opt-counter');
  await shot('feature-magnifier', 'assist-opt-magnifier');
  for (const id of ['assist-opt-long-arrow', 'assist-opt-hand', 'assist-opt-feedback', 'assist-opt-dim', 'assist-opt-counter', 'assist-opt-magnifier']) {
    await page.getByTestId(id).check();
  }

  await page.locator('[data-coach="navigator-btn"]').click();
  await expect(page.getByTestId('assist-wrong-toast')).toHaveText('Not this one - look for the arrow');
  await expect(page.getByRole('button', { name: 'Purchase Requisitions' }).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/feature-wrong-click.png' });
  await page.evaluate(() => {
    const el = document.querySelector('.bg-black\\/25');
    if (el instanceof HTMLElement) el.click();
  });
  await expect(page.locator('.bg-black\\/25')).toHaveCount(0);

  await page.locator('[data-coach="guide-next"]').click();
  await expect(page.getByTestId('assist-ripple')).toBeVisible();
  await expect(page.getByTestId('assist-tick')).toBeVisible();
  await expect(page.getByTestId('assist-long-arrow')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/feature-ripple.png' });
  await page.getByRole('button', { name: /Got it/ }).click();
  await expect.poll(async () => (await targetBox(page))?.inside).toBeTruthy();
  await expect(page.getByTestId('step-title')).not.toHaveText('What is an ERP?');

  for (const id of SAMPLE) {
    await page.getByTestId('teacher-jump').selectOption(id);
    await expect.poll(async () => (await targetBox(page))?.inside).toBeTruthy();
    await expect(page.getByTestId('assist-hand')).toBeVisible();
    await expect(page.getByTestId('assist-magnifier')).toBeVisible();
    await expect(page.getByTestId('assist-dim-hole')).toBeVisible();
    const info = await targetBox(page);
    await expect(page.getByTestId('assist-step-count')).toHaveAttribute('data-total', '45');
    const hole = await page.getByTestId('assist-dim-hole').boundingBox();
    const target = await page.locator(`[data-coach="${info!.id}"]`).first().boundingBox();
    expect(hole && target).toBeTruthy();
    const cx = target!.x + target!.width / 2;
    const cy = target!.y + target!.height / 2;
    expect(cx).toBeGreaterThan(hole!.x);
    expect(cx).toBeLessThan(hole!.x + hole!.width);
    expect(cy).toBeGreaterThan(hole!.y);
    expect(cy).toBeLessThan(hole!.y + hole!.height);
  }

  await page.getByTestId('presenter-close').click();
  await expect.poll(async () => (await targetBox(page))?.inside).toBeTruthy();

  for (const zoom of ['0.5', '1', '1.5']) {
    await page.evaluate((value) => {
      document.documentElement.style.zoom = value;
    }, zoom);
    await expect.poll(async () => (await targetBox(page))?.inside).toBeTruthy();
  }
  await page.evaluate(() => {
    document.documentElement.style.zoom = '1';
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await targetBox(page))?.inside).toBeTruthy();
});

test('voice reads the step only when the speaker is on', async ({ page }) => {
  await page.addInitScript(() => {
    const calls: { type: string; text?: string; lang?: string }[] = [];
    const synth = {
      cancel() { calls.push({ type: 'cancel' }); },
      speak(utterance: { text: string; lang: string }) { calls.push({ type: 'speak', text: utterance.text, lang: utterance.lang }); },
      getVoices() {
        return [
          { lang: 'gu-IN', name: 'Gujarati' },
          { lang: 'en-IN', name: 'English' },
        ];
      },
      addEventListener() {},
      removeEventListener() {},
    };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth });
    (window as unknown as { __speechCalls: typeof calls }).__speechCalls = calls;
  });
  await signIn(page, 'student');
  const speaks = () => page.evaluate(() => (window as unknown as { __speechCalls: { type: string; text?: string; lang?: string }[] }).__speechCalls.filter((call) => call.type === 'speak'));
  expect(await speaks()).toEqual([]);
  await page.getByTestId('assist-speaker').click();
  await expect.poll(async () => (await speaks()).length).toBeGreaterThan(0);
  const english = (await speaks()).at(-1)!;
  expect(english.lang).toMatch(/^en/i);
  expect(english.text).toContain('ERP');
  await page.getByTestId('assist-voice-lang').selectOption('gu');
  await expect.poll(async () => (await speaks()).at(-1)?.lang).toBe('gu-IN');
  expect(((await speaks()).at(-1)?.text || '')).toContain('ઈઆરપી');
  const before = (await speaks()).length;
  await page.locator('[data-coach="guide-next"]').click();
  await page.getByRole('button', { name: /Got it/ }).click();
  await expect.poll(async () => (await speaks()).length).toBeGreaterThan(before);
  await page.getByTestId('assist-speaker').click();
  const afterOff = (await speaks()).length;
  await page.locator('[data-coach="guide-next"]').click();
  await page.getByRole('button', { name: /Got it/ }).click();
  expect(await speaks()).toHaveLength(afterOff);
});

test('gujarati falls back to English when that voice is missing', async ({ page }) => {
  await page.addInitScript(() => {
    const calls: { type: string; text?: string; lang?: string }[] = [];
    const synth = {
      cancel() { calls.push({ type: 'cancel' }); },
      speak(utterance: { text: string; lang: string }) { calls.push({ type: 'speak', text: utterance.text, lang: utterance.lang }); },
      getVoices() { return [{ lang: 'en-US', name: 'English' }]; },
      addEventListener() {},
      removeEventListener() {},
    };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth });
    (window as unknown as { __speechCalls: typeof calls }).__speechCalls = calls;
  });
  await signIn(page, 'student');
  await page.getByTestId('assist-voice-lang').selectOption('gu');
  await page.getByTestId('assist-speaker').click();
  await expect(page.getByTestId('assist-voice-notice')).toContainText('Gujarati voice is not on this computer');
  await expect.poll(async () => page.evaluate(() => {
    const calls = (window as unknown as { __speechCalls: { type: string; lang?: string }[] }).__speechCalls;
    return calls.filter((call) => call.type === 'speak').at(-1)?.lang || '';
  })).toMatch(/^en/i);
});
