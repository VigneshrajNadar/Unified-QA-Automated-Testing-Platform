// Sample Selenium Test Script for deployment on the Cloud
// This script uses the 'targetUrl' variable if provided, otherwise defaults to selenium.dev

const url = targetUrl || 'https://www.selenium.dev';
log(`Target URL: ${url}`);
log('Navigating...');

await driver.get(url);

const title = await driver.getTitle();
log(`Page Title: ${title}`);

// Simple assertion (Check if title is not empty)
if (!title) {
    throw new Error(`Page title is empty!`);
}

log(`Successfully loaded ${url}`);
log('Test passed!');
