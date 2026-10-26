import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, '..', '..', 'docs', 'screenshots');
const webUrl = process.env.KINEVOR_WEB_URL ?? 'http://localhost:4203';
const apiUrl = process.env.KINEVOR_API_URL ?? 'http://localhost:5084';
const channel = process.env.PLAYWRIGHT_CHANNEL ?? 'chrome';
const memberId = '11111111-1111-1111-1111-111111111111';
const demoHeaders = {
  'X-Demo-Role': 'Member',
  'X-Demo-Member': memberId,
};

const browser = await chromium.launch(channel ? { channel } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });

try {
  await mkdir(output, { recursive: true });
  const currentResponse = await fetch(`${apiUrl}/api/v1/me/memberships/current`, {
    headers: demoHeaders,
  });
  if (!currentResponse.ok) {
    throw new Error(`Could not load demo membership (${currentResponse.status}).`);
  }
  const current = (await currentResponse.json()).data;

  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.goto(`${webUrl}/memberships`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('kinevor-membership-overview .current-hero', { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({
    path: resolve(output, 'web-membership-dashboard.png'),
    fullPage: false,
  });
  console.log('saved web-membership-dashboard.png');

  await page.goto(`${webUrl}/memberships/plans`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('kinevor-plan-catalogue .plan-card', { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({
    path: resolve(output, 'web-plans.png'),
    fullPage: false,
  });
  console.log('saved web-plans.png');

  await page.goto(`${webUrl}/memberships/${current.id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('kinevor-membership-detail .detail-hero', { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({
    path: resolve(output, 'web-membership-detail.png'),
    fullPage: false,
  });
  console.log('saved web-membership-detail.png');

  await page.goto(`${apiUrl}/swagger/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.swagger-ui .info', { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: resolve(output, 'api-swagger.png'),
    fullPage: true,
  });
  console.log('saved api-swagger.png');
} finally {
  await browser.close();
}
