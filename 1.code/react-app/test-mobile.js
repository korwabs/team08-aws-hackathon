const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set viewport to 360px width (common mobile size)
  await page.setViewportSize({ width: 360, height: 800 });
  
  // Navigate to the app
  await page.goto('http://localhost:5173');
  
  // Take screenshot of login page
  await page.screenshot({ path: 'login-360px.png', fullPage: true });
  
  console.log('Login page screenshot taken at 360px width');
  
  // Wait for user to check the design
  await page.waitForTimeout(10000);
  
  await browser.close();
})();
