// Sample Selenium Test Script for deployment on the Cloud
// This script will be executed inside an async function with access to:
// 'driver' (Selenium WebDriver instance)
// 'assert' (Node.js assert module)
// 'log' (Function to log messages to the dashboard)

log('Navigating to Google...');
await driver.get('https://www.google.com');

const title = await driver.getTitle();
log(`Page Title: ${title}`);

// Simple assertion
if (!title.includes('Google')) {
    throw new Error('Title does not contain Google');
}

log('Searching for Selenium...');
const searchBox = await driver.findElement(By.name('q'));
await searchBox.sendKeys('Selenium', Key.RETURN);

await driver.wait(until.titleContains('Selenium'), 5000);
log('Search completed.');

// Note: 'By', 'Key', 'until' need to be available.
// My seleniumService implementation didn't expose them in the Function scope!
// I must fix seleniumService.js to expose By, Key, until from selenium-webdriver.
