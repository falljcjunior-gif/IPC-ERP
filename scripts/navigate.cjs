const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const url = process.argv[2] || 'http://localhost:5173';
  const screenshotName = process.argv[3] || 'navigation_result.png';
  const screenshotPath = path.join(process.cwd(), 'artifacts', screenshotName);

  console.log(`Navigating to: ${url}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log(`Page title: ${await page.title()}`);
    
    // Take screenshot
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`PAGE ERROR: ${msg.text()}`);
    });

  } catch (err) {
    console.error(`Navigation failed: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
