const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'http://localhost:5174/hr';
  console.log(`Inspecting HR module at: ${url}`);

  try {
    // Navigate to the app
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    
    // Inject mock login
    await page.evaluate(() => {
      if (window.__IPC_DEV_LOGIN__) {
        window.__IPC_DEV_LOGIN__('SUPER_ADMIN');
      }
    });

    // Now go to HR
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log(`Page title: ${await page.title()}`);
    
    // Wait for any potential redirects
    await page.waitForTimeout(2000);
    console.log(`Current URL: ${page.url()}`);

    // Take screenshot
    const screenshotPath = path.join(process.cwd(), 'artifacts', 'hr_inspection.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Inspect the DOM for specific HR elements
    const hasHRTitle = await page.evaluate(() => {
      return document.body.innerText.includes('Human Capital') || document.body.innerText.includes('Ressources Humaines');
    });
    console.log(`HR content detected: ${hasHRTitle}`);

  } catch (err) {
    console.error(`Inspection failed: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
