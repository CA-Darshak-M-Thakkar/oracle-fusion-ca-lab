import { expect, test, type Page } from '@playwright/test';
import { clickCoach, followGuideToEnd, noHorizontalOverflow, signIn, watchPage } from './helpers';

async function boxOf(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, selector).toBeTruthy();
  return box!;
}

function inside(box: { x: number; y: number; width: number; height: number }, width: number, height: number) {
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
}

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return a.x < b.x + b.width - 1 && a.x + a.width > b.x + 1 && a.y < b.y + b.height - 1 && a.y + a.height > b.y + 1;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('login controls, privacy links, and no name form', async ({ page }) => {
  const errors = watchPage(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Oracle Fusion practice' })).toBeVisible();
  await expect(page.getByPlaceholder('Priya Shah')).toHaveCount(0);
  await expect(page.getByTestId('e2e-student')).toBeVisible();

  const font = page.getByTestId('font-size');
  await font.selectOption('150');
  await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-font'))).toBe('150');
  await font.selectOption('125');

  await page.getByTestId('assist-style').selectOption('arrow');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('oracle_fusion_assist'))).toBe('arrow');
  await page.getByTestId('assist-style').selectOption('all');

  await page.getByRole('button', { name: 'Light theme' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('light-theme'))).toBe(true);
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark-theme'))).toBe(true);

  for (const href of ['./privacy.html', './terms.html']) {
    const res = await page.request.get(href);
    expect(res.status(), href).toBe(200);
    const body = await res.text();
    expect(body).toContain('cadmthakkar@gmail.com');
    expect(body.toLowerCase()).toContain('name');
    expect(body.toLowerCase()).toContain('email');
  }
  expect(errors).toEqual([]);
});

test('each assist style points at the next control', async ({ page }) => {
  await signIn(page, 'student');
  await expect(page.getByTestId('step-title')).toHaveText('What is an ERP?');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Signed in')).toHaveCount(0);
  const styles = ['all', 'arrow', 'highlighter', 'blinker', 'spotlight', 'off'] as const;
  for (const style of styles) {
    await page.getByTestId('assist-style').selectOption(style);
    await page.waitForTimeout(style === 'off' ? 200 : 400);
    if (style === 'off') {
      await expect(page.getByTestId('assist-layer')).toHaveCount(0);
      await expect(page.getByTestId('assist-arrow')).toHaveCount(0);
    } else {
      await expect(page.getByTestId('assist-layer')).toHaveAttribute('data-assist', style);
      await expect(page.getByTestId(style === 'all' ? 'assist-spotlight' : `assist-${style}`)).toBeVisible();
    }
    await page.screenshot({ path: `test-results/assist-${style}.png`, fullPage: false });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByTestId('assist-style').selectOption('blinker');
  const animation = await page.getByTestId('assist-blinker').evaluate((el) => getComputedStyle(el).animationName);
  expect(animation === 'none' || animation === '').toBeTruthy();
  await page.getByTestId('assist-style').selectOption('all');
});

test('student walks orientation and all four labs by the arrows', async ({ page }) => {
  const errors = watchPage(page);
  await signIn(page, 'student');
  await expect(page.getByRole('button', { name: 'Presenter' })).toHaveCount(0);
  await expect(page.getByTestId('step-title')).toHaveText('What is an ERP?');
  await noHorizontalOverflow(page);

  await followGuideToEnd(page);
  await expect(page.getByText('The four labs are done.')).toBeVisible();
  await expect(page.getByText(/Chairs: stock and GST/)).toBeVisible();
  await page.getByRole('button', { name: /Got it/ }).click();
  await expect(page.locator('[data-coach="bubble-next"]')).toHaveCount(0);

  await page.goto('/#scheduled_processes');
  await page.getByRole('button', { name: 'View Output' }).first().click();
  await expect(page.getByText(/Books balance/)).toBeVisible();
  await expect(page.getByText(/Debit total/)).toBeVisible();
  expect(errors.filter((e) => !/ResizeObserver/.test(e))).toEqual([]);
});

test('student surfaces: springboard, navigator, search, map, lab pack, roles, EBS', async ({ page }) => {
  const errors = watchPage(page);
  await signIn(page, 'student');
  await page.goto('/#home');
  const tabs = ['Me', 'Procurement', 'Order Management', 'Supply Chain Execution', 'Payables', 'Receivables', 'General Accounting', 'Tools', 'Risk Management'];
  for (const tab of tabs) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    await expect(page.getByText('QUICK ACTIONS')).toBeVisible();
  }
  await page.getByRole('button', { name: 'Procurement', exact: true }).click();
  await page.getByRole('button', { name: 'Purchase Requisitions' }).first().click();
  await expect(page.getByText(/Requisition|Noncatalog|Recent Requisitions/i).first()).toBeVisible();

  await page.getByRole('button', { name: 'ORACLE' }).click();
  const navLabels = [
    'Purchase Requisitions', 'Process Requisitions', 'Purchase Orders', 'My Receipts',
    'Invoices', 'Payments', 'Order Management', 'Create Sales Order',
    'Inventory Management', 'Pick Waves & Confirm Picks', 'Manage Shipments',
    'Billing', 'Accounts Receivable', 'Bank Reconciliation',
    'General Accounting Dashboard', 'Inquire on Detail Balances', 'Journals',
    'Scheduled Processes', 'Audit Reports', 'CA Audit Lab & Case Studies',
  ];
  for (const label of navLabels) {
    const item = page.getByRole('button', { name: label, exact: true }).last();
    if (!(await item.isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'ORACLE' }).click();
    }
    await page.getByRole('button', { name: label, exact: true }).last().click();
    await expect(page.locator('main, h1, h2').first()).toBeVisible();
  }

  await page.goto('/#home');
  await page.getByPlaceholder(/Search modules/i).fill('Paper');
  await expect(page.getByText(/Paper|PO-10|Patel/i).first()).toBeVisible();

  await page.getByRole('button', { name: /Process Map/ }).click();
  await expect(page.getByText(/Use/)).toBeVisible();
  await page.getByRole('button', { name: /Order to Cash|O2C/i }).first().click();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: /Lab Pack/ }).click();
  for (const file of [
    '01_CA_Student_Lab_Workbook.txt',
    '02_Sample_P2P_Practice_Data.csv',
    '03_Sample_O2C_Practice_Data.csv',
    '04_Sample_Audit_Checklist_AICITSS.csv',
  ]) {
    const res = await page.request.get(`./sample-files/${file}`);
    expect(res.status(), file).toBe(200);
  }
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download Lab Submission/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('Oracle_Fusion');
  await page.getByRole('button', { name: 'Close lab pack' }).click();

  await page.getByRole('button', { name: /^[A-Z]{2}$/ }).click();
  await page.getByRole('button', { name: 'Approver', exact: true }).click();
  await expect(page.getByText(/You are now the Approver/)).toBeVisible();

  await page.getByRole('button', { name: /EBS R12/ }).click();
  await expect(page.getByText(/Older product: E-Business Suite/)).toBeVisible();
  const ebsButtons = page.locator('button');
  const count = Math.min(await ebsButtons.count(), 12);
  for (let i = 0; i < count; i++) {
    const btn = ebsButtons.nth(i);
    if (await btn.isVisible()) await btn.click().catch(() => undefined);
  }
  await page.getByRole('button', { name: /Fusion Cloud/ }).click();
  await expect(page.getByTestId('step-title')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#home');
  await noHorizontalOverflow(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await noHorizontalOverflow(page);
  expect(errors.filter((e) => !/ResizeObserver|Failed to load resource/.test(e))).toEqual([]);
});

test('holds, credit limit, reports and audit cases', async ({ page }) => {
  const errors = watchPage(page);
  await signIn(page, 'student');
  await page.goto('/#create_sales_order');
  await page.locator('main select').first().selectOption('Shah Stores');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText(/On Hold|Credit/i).first()).toBeVisible();

  await page.goto('/#payables_invoices');
  await page.getByRole('button', { name: /^[A-Z]{2}$/ }).click();
  await page.getByRole('button', { name: 'Approver', exact: true }).click();
  await page.getByTestId('release-PAPER-100').click();
  await expect(page.getByText('Hold released')).toBeVisible();

  await page.goto('/#journals');
  await page.getByPlaceholder(/Accrued Audit Fee|Description/i).fill('Classroom test journal');
  await page.getByRole('button', { name: /Post Journal/ }).click();
  await expect(page.getByText('Classroom test journal')).toBeVisible();

  await page.goto('/#scheduled_processes');
  await page.getByRole('button', { name: /Schedule New Process/ }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText(/Report ready|Succeeded/).first()).toBeVisible();
  await page.getByRole('row', { name: /Supplier Balance Aging/ }).getByRole('button', { name: 'View Output' }).click();
  await expect(page.getByText(/0.30/).first()).toBeVisible();
  await expect(page.getByText(/90\+/).first()).toBeVisible();

  await page.goto('/#ca_audit_lab');
  await page.getByRole('button', { name: /Case 9.1/ }).click();
  await page.getByRole('button', { name: /Show item movement/ }).click();
  await expect(page.getByText('Purchase order PO-10')).toBeVisible();
  await page.getByRole('button', { name: /Case 9.2/ }).click();
  await page.getByRole('button', { name: /packing slip/i }).click();
  await expect(page.getByText(/Bill of lading/i).first()).toBeVisible();
  await page.getByRole('button', { name: /Company LMN/ }).click();
  await page.getByRole('button', { name: /I have reviewed this/ }).click();
  await page.getByRole('button', { name: /Extra classroom/ }).click();
  await expect(page.getByText(/1,000 ordered/)).toBeVisible();
  expect(errors.filter((e) => !/ResizeObserver/.test(e))).toEqual([]);
});

test('teacher presenter: talking points, jump, reset, attendance, and a student cannot see it', async ({ page }) => {
  const errors = watchPage(page);
  await signIn(page, 'teacher');
  await expect(page.getByRole('button', { name: 'Presenter', exact: true })).toBeVisible();
  await expect(page.getByText('Teacher notes')).toBeVisible();
  await expect(page.getByText(/Say: Tally is mostly accounts/)).toBeVisible();
  await page.getByTestId('teacher-assist').selectOption('highlighter');
  await expect(page.getByTestId('assist-highlighter')).toBeVisible();
  await page.getByTestId('teacher-assist').selectOption('all');
  await expect(page.getByText(/Sign-in records name, email and role/)).toBeVisible();
  await expect(page.getByText(/Adv ITT/)).toBeVisible();
  await expect(page.getByText(/paste the updated Apps Script/)).toHaveCount(0);
  await expect(page.getByTestId('presenter-panel')).toHaveAttribute('data-layout', 'push');

  await page.getByTestId('teacher-jump').selectOption('gl-tb');
  await expect(page.getByTestId('step-title')).toHaveText('Trial balance');
  await clickCoach(page);
  await expect(page.getByText(/Books balance\. Debit total/)).toBeVisible();
  if (await page.getByRole('button', { name: /Got it/ }).isVisible()) {
    await page.getByRole('button', { name: /Got it/ }).click();
  }

  await page.getByRole('button', { name: /Reset demo data/ }).click();
  await expect(page.getByText('Demo reset')).toBeVisible();

  await page.locator('[data-coach="user-menu"]').click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await signIn(page, 'student');
  await expect(page.getByRole('button', { name: 'Presenter' })).toHaveCount(0);
  await expect(page.getByText('Teacher notes')).toHaveCount(0);
  expect(errors.filter((e) => !/ResizeObserver/.test(e))).toEqual([]);
});

test('notes drawer pushes the lesson and the guide stays on screen', async ({ page }) => {
  await signIn(page, 'teacher');
  await page.getByTestId('lesson-column').getByRole('button', { name: 'Close', exact: true }).click({ force: true });
  await page.getByTestId('teacher-jump').selectOption('ori-spring');
  await expect(page.getByTestId('step-title')).toHaveText('The home page is the Springboard');
  await expect(page.getByTestId('coach-callout')).toContainText('Look along the row of tabs');
  const plain = page.getByTestId('step-plain');
  const toolbar = page.getByTestId('classroom-toolbar');
  expect((await plain.boundingBox())!.y).toBeGreaterThan((await toolbar.boundingBox())!.y);

  for (const size of [
    { width: 1366, height: 768, file: 'drawer-1366' },
    { width: 2732, height: 1190, file: 'drawer-2732' },
    { width: 1024, height: 600, file: 'drawer-1024' },
  ]) {
    await page.setViewportSize({ width: size.width, height: size.height });
    const toggle = page.getByRole('button', { name: 'Presenter', exact: true });
    await toggle.click();
    if ((await page.getByTestId('presenter-panel').count()) === 0) await toggle.click();
    await expect(page.getByTestId('presenter-panel')).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('oracle_fusion_presenter'))).toBe('open');
    const view = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
    await expect.poll(async () => {
      const callout = await page.getByTestId('coach-callout').boundingBox();
      const next = await page.locator('[data-coach="guide-next"]').boundingBox();
      if (!callout || !next) return false;
      return !overlaps(callout, next);
    }).toBeTruthy();
    const callout = await boxOf(page, '[data-testid="coach-callout"]');
    const next = await boxOf(page, '[data-coach="guide-next"]');
    const panel = await boxOf(page, '[data-testid="presenter-panel"]');
    inside(callout, view.width, view.height);
    inside(next, view.width, view.height);
    inside(panel, view.width, view.height);
    expect(overlaps(panel, next), 'notes cover Next').toBeFalsy();
    expect(overlaps(panel, callout), 'notes cover the guide card').toBeFalsy();
    if (size.width >= 1100) {
      await expect(page.getByTestId('presenter-panel')).toHaveAttribute('data-layout', 'push');
      const column = await boxOf(page, '[data-testid="lesson-column"]');
      expect(Math.abs(column.x + column.width - panel.x)).toBeLessThan(3);
      const mask = await boxOf(page, '[data-testid="assist-spotlight-mask"]');
      expect(overlaps(mask, panel), 'spotlight dims the notes').toBeFalsy();
    }
    await expect.poll(() => assistHitsTarget(page)).toBe('ok');
    await page.screenshot({ path: `test-results/${size.file}-open.png` });
    await page.getByTestId('presenter-close').click();
    await expect(page.getByTestId('presenter-panel')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('oracle_fusion_presenter'))).toBe('closed');
    const nextClosed = await boxOf(page, '[data-coach="guide-next"]');
    const calloutClosed = await boxOf(page, '[data-testid="coach-callout"]');
    inside(nextClosed, view.width, view.height);
    inside(calloutClosed, view.width, view.height);
    await expect.poll(() => assistHitsTarget(page)).toBe('ok');
    await page.screenshot({ path: `test-results/${size.file}-closed.png` });
  }

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByRole('button', { name: 'Presenter', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('presenter-panel')).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId('presenter-tab')).toBeVisible();
  await page.getByTestId('presenter-tab').click();
  await expect(page.getByTestId('presenter-panel')).toHaveAttribute('data-layout', 'flow');

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByRole('button', { name: /EBS R12/ }).click();
  await expect(page.getByText(/Older product: E-Business Suite/)).toBeVisible();
  await expect(page.getByTestId('coach-callout')).toContainText('Switch to Oracle Fusion Cloud UI');
  await expect.poll(async () => page.evaluate(() => {
    const layer = document.querySelector('[data-testid="assist-layer"]')?.getBoundingClientRect();
    const button = document.querySelector('[data-coach="switch-to-fusion"]')?.getBoundingClientRect();
    if (!layer || !button) return false;
    const width = Math.max(0, Math.min(layer.right, button.right) - Math.max(layer.left, button.left));
    const height = Math.max(0, Math.min(layer.bottom, button.bottom) - Math.max(layer.top, button.top));
    return width > 8 && height > 8;
  })).toBeTruthy();
  await page.screenshot({ path: 'test-results/ebs-guide.png' });
});

async function assistHitsTarget(page: Page) {
  return page.evaluate(() => {
    const layer = document.querySelector('[data-testid="assist-layer"]');
    const arrow = document.querySelector('[data-testid="assist-arrow"]');
    const mark = document.querySelector('[data-testid="assist-highlighter"]');
    if (!layer || !arrow || !mark) return 'missing';
    const targetId = layer.getAttribute('data-target');
    const target = targetId ? document.querySelector(`[data-coach="${targetId}"]`) : null;
    if (!target) return 'no-target';
    const hit = (box: DOMRect, other: DOMRect) => {
      const width = Math.max(0, Math.min(box.right, other.right) - Math.max(box.left, other.left));
      const height = Math.max(0, Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top));
      return width > 8 && height > 8;
    };
    const layerBox = layer.getBoundingClientRect();
    const targetBox = target.getBoundingClientRect();
    if (layerBox.width < 8 || layerBox.height < 8) return 'zero';
    if (!hit(layerBox, targetBox)) return `miss ${targetId}`;
    if (targetBox.bottom < 4 || targetBox.top > window.innerHeight - 4 || targetBox.right < 4 || targetBox.left > window.innerWidth - 4) {
      return `offscreen ${targetId}`;
    }
    if (arrow.getBoundingClientRect().width < 8) return 'no-arrow';
    return 'ok';
  });
}

test('assist mark hits every step, including a stale saved value', async ({ page }) => {
  test.setTimeout(300_000);
  await page.addInitScript(() => {
    localStorage.setItem('oracle_fusion_assist', 'dismissed');
    localStorage.setItem('oracle_fusion_presenter', 'open');
  });
  await signIn(page, 'teacher');
  await expect.poll(() => assistHitsTarget(page)).toBe('ok');
  const ids = await page.getByTestId('teacher-jump').locator('option').evaluateAll((opts) => opts.map((opt) => (opt as HTMLOptionElement).value));
  expect(ids.length).toBeGreaterThan(30);
  for (const size of [
    { width: 1366, height: 768 },
    { width: 2732, height: 1190 },
  ]) {
    await page.setViewportSize(size);
    for (const id of ids) {
      await page.getByTestId('teacher-jump').selectOption(id);
      await expect.poll(() => assistHitsTarget(page), { timeout: 5000 }).toBe('ok');
    }
    await page.screenshot({ path: `test-results/assist-every-step-${size.width}.png` });
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByTestId('presenter-close').click();
  await expect(page.getByTestId('presenter-panel')).toHaveCount(0);
  await expect.poll(() => assistHitsTarget(page)).toBe('ok');
  await page.screenshot({ path: 'test-results/assist-presenter-closed-1366.png' });
});
