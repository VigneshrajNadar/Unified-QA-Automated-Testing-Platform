/**
 * Playwright Screenshot Utility
 * Captures full-page screenshots for visual regression testing
 */

const { chromium, firefox, webkit } = require('playwright');
const path = require('path');
const fs = require('fs');

const browsers = {
    chrome: chromium,
    firefox: firefox,
    safari: webkit
};

const viewports = {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
};

/**
 * Capture screenshot of a URL
 * @param {string} url - URL to capture
 * @param {string} browserType - 'chrome', 'firefox', or 'safari'
 * @param {string} viewportType - 'desktop', 'tablet', or 'mobile'
 * @param {string} outputPath - Path to save screenshot
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Screenshot info
 */
async function captureScreenshot(url, browserType = 'chrome', viewportType = 'desktop', outputPath, options = {}) {
    const browserEngine = browsers[browserType];
    if (!browserEngine) {
        throw new Error(`Invalid browser type: ${browserType}`);
    }

    const viewport = viewports[viewportType];
    if (!viewport) {
        throw new Error(`Invalid viewport type: ${viewportType}`);
    }

    let browser = null;
    let page = null;

    try {
        // Launch browser
        browser = await browserEngine.launch({
            headless: true,
            executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
            ...options.browserOptions
        });

        // Create new page with viewport
        page = await browser.newPage({
            viewport,
            ...options.pageOptions
        });

        // Set timeout
        page.setDefaultTimeout(options.timeout || 30000);

        // Navigate to URL
        await page.goto(url, {
            waitUntil: options.waitUntil || 'networkidle',
            timeout: options.navTimeout || 30000
        });

        // Wait for additional time if specified
        if (options.waitTime) {
            await page.waitForTimeout(options.waitTime);
        }

        // Hide dynamic elements if ignore selectors provided
        if (options.ignoreSelectors && options.ignoreSelectors.length > 0) {
            for (const selector of options.ignoreSelectors) {
                try {
                    await page.addStyleTag({
                        content: `${selector} { visibility: hidden !important; opacity: 0 !important; }`
                    });
                } catch (err) {
                    console.warn(`Could not hide selector: ${selector}`);
                }
            }
        }

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Capture screenshot
        await page.screenshot({
            path: outputPath,
            fullPage: options.fullPage !== false, // Default to full page
            type: options.type || 'png'
        });

        // Get page info
        const title = await page.title();
        const dimensions = await page.evaluate(() => ({
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight
        }));

        return {
            success: true,
            url,
            browser: browserType,
            viewport: viewportType,
            outputPath,
            pageTitle: title,
            dimensions,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error(`Error capturing screenshot for ${url}:`, error.message);
        return {
            success: false,
            url,
            browser: browserType,
            viewport: viewportType,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    } finally {
        // Clean up
        if (page) await page.close().catch(() => { });
        if (browser) await browser.close().catch(() => { });
    }
}

/**
 * Capture screenshots for multiple URLs
 * @param {Array<string>} urls - Array of URLs
 * @param {string} browserType - Browser to use
 * @param {string} viewportType - Viewport size
 * @param {string} outputDir - Directory to save screenshots
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of screenshot results
 */
async function captureMultiple(urls, browserType, viewportType, outputDir, options = {}) {
    const results = [];

    for (const url of urls) {
        const pageName = getPageNameFromUrl(url);
        const filename = `${pageName}_${browserType}_${viewportType}.png`;
        const outputPath = path.join(outputDir, filename);

        const result = await captureScreenshot(url, browserType, viewportType, outputPath, options);
        results.push({
            ...result,
            pageName,
            filename
        });

        // Optional delay between screenshots
        if (options.delayBetween) {
            await new Promise(resolve => setTimeout(resolve, options.delayBetween));
        }
    }

    return results;
}

/**
 * Extract page name from URL for filename
 */
function getPageNameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        let pathname = urlObj.pathname;

        // Remove leading/trailing slashes
        pathname = pathname.replace(/^\/+|\/+$/g, '');

        // If empty, it's the home page
        if (!pathname) return 'home';

        // Replace slashes with underscores
        pathname = pathname.replace(/\//g, '_');

        // Remove file extensions
        pathname = pathname.replace(/\.(html|php|aspx?)$/i, '');

        // Limit length and sanitize
        pathname = pathname.substring(0, 50).replace(/[^a-z0-9_-]/gi, '_');

        return pathname || 'page';
    } catch (err) {
        return 'page';
    }
}

/**
 * Get available browsers
 */
function getAvailableBrowsers() {
    return Object.keys(browsers);
}

/**
 * Get available viewports
 */
function getAvailableViewports() {
    return Object.keys(viewports);
}

/**
 * Validate URL
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }
}

module.exports = {
    captureScreenshot,
    captureMultiple,
    getPageNameFromUrl,
    getAvailableBrowsers,
    getAvailableViewports,
    isValidUrl,
    browsers,
    viewports
};
