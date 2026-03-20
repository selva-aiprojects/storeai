import puppeteer from 'puppeteer';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const creds = { email: 'admin@storeai.com', password: 'Admin@123', tenant: 'storeai' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const checks = [];
const record = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ` | ${detail}` : ''}`);
};

async function clickByText(page, text) {
  return page.evaluate((label) => {
    const targets = [...document.querySelectorAll('button, a, [role="button"]')];
    const el = targets.find((n) => (n.textContent || '').toLowerCase().includes(label.toLowerCase()));
    if (!el) return false;
    el.click();
    return true;
  }, text);
}

async function assertRoute(page, menuLabel, pathPart, expectedText) {
  const clicked = await clickByText(page, menuLabel);
  await sleep(3000);
  const url = page.url();
  const body = await page.evaluate(() => (document.body.innerText || '').toLowerCase());
  const ok = clicked && url.includes(pathPart) && body.includes(expectedText.toLowerCase());
  record(`Route ${menuLabel}`, ok, `url=${url}`);
}

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
page.setDefaultTimeout(45000);

try {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', creds.email);
  await page.type('input[type="password"]', creds.password);

  const textInputs = await page.$$('input[type="text"]');
  if (textInputs.length) {
    await textInputs[textInputs.length - 1].type(creds.tenant);
  }

  const loginClicked = await clickByText(page, 'sign in to storeai');
  await sleep(7000);
  const postLoginText = await page.evaluate(() => (document.body.innerText || '').toLowerCase());
  const loggedIn = !page.url().includes('/login') && postLoginText.includes('dashboard');
  record('Login', loginClicked && loggedIn, `url=${page.url()}`);

  await assertRoute(page, 'Stock Master', '/inventory', 'stock');
  await assertRoute(page, 'Procurement Hub', '/purchases', 'orders');
  await assertRoute(page, 'Sales [POS]', '/sales', 'sales');
  await assertRoute(page, 'Employee Master', '/hr-master', 'employee');

  const total = checks.length;
  const failed = checks.filter((c) => !c.ok).length;
  console.log(`SUMMARY total=${total} failed=${failed}`);
  process.exit(failed ? 2 : 0);
} catch (error) {
  record('Runner', false, String(error));
  const total = checks.length;
  const failed = checks.filter((c) => !c.ok).length;
  console.log(`SUMMARY total=${total} failed=${failed}`);
  process.exit(3);
} finally {
  await browser.close();
}
