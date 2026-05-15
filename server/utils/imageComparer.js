/**
 * Image Comparison Utility using Pixelmatch
 * Compares two images pixel-by-pixel and generates diff image
 */

const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

/**
 * Compare two images and generate diff
 * @param {string} baselinePath - Path to baseline image
 * @param {string} currentPath - Path to current/new image
 * @param {string} diffPath - Path to save diff image
 * @param {Object} options - Comparison options
 * @returns {Object} Comparison results
 */
function compareImages(baselinePath, currentPath, diffPath, options = {}) {
    try {
        // Check if files exist
        if (!fs.existsSync(baselinePath)) {
            throw new Error(`Baseline image not found: ${baselinePath}`);
        }
        if (!fs.existsSync(currentPath)) {
            throw new Error(`Current image not found: ${currentPath}`);
        }

        // Read images
        const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
        const img2 = PNG.sync.read(fs.readFileSync(currentPath));

        const { width, height } = img1;

        // Validate dimensions match
        if (img1.width !== img2.width || img1.height !== img2.height) {
            return {
                success: false,
                error: 'Image dimensions do not match',
                baseline: { width: img1.width, height: img1.height },
                current: { width: img2.width, height: img2.height }
            };
        }

        // Create diff image
        const diff = new PNG({ width, height });

        // Perform pixel comparison
        const mismatchPixels = pixelmatch(
            img1.data,
            img2.data,
            diff.data,
            width,
            height,
            {
                threshold: options.threshold || 0.1,      // Sensitivity (0-1)
                alpha: options.alpha || 0.1,              // Opacity of diff
                aa: options.antialiasing !== false,        // Anti-aliasing
                diffColor: options.diffColor || [255, 0, 255],  // Pink highlight
                diffMask: options.diffMask || false
            }
        );

        // Ensure diff directory exists
        const diffDir = path.dirname(diffPath);
        if (!fs.existsSync(diffDir)) {
            fs.mkdirSync(diffDir, { recursive: true });
        }

        // Save diff image
        fs.writeFileSync(diffPath, PNG.sync.write(diff));

        // Calculate statistics
        const totalPixels = width * height;
        const mismatchPercentage = (mismatchPixels / totalPixels) * 100;

        // Determine status based on thresholds
        const status = determineStatus(mismatchPercentage, options);

        return {
            success: true,
            totalPixels,
            mismatchPixels,
            mismatchPercentage: parseFloat(mismatchPercentage.toFixed(4)),
            matchPercentage: parseFloat((100 - mismatchPercentage).toFixed(4)),
            status,
            severity: determineSeverity(mismatchPercentage),
            dimensions: { width, height },
            diffImagePath: diffPath,
            baseline: baselinePath,
            current: currentPath
        };

    } catch (error) {
        console.error('Error comparing images:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Determine pass/warning/fail status
 */
function determineStatus(mismatchPercentage, options = {}) {
    const passThreshold = options.passThreshold || 0.5;
    const warnThreshold = options.warnThreshold || 3.0;

    if (mismatchPercentage < passThreshold) {
        return 'pass';
    } else if (mismatchPercentage < warnThreshold) {
        return 'warning';
    } else {
        return 'fail';
    }
}

/**
 * Determine severity level for defect creation
 */
function determineSeverity(mismatchPercentage) {
    if (mismatchPercentage < 0.5) {
        return 'Low';
    } else if (mismatchPercentage < 1.0) {
        return 'Low';
    } else if (mismatchPercentage < 3.0) {
        return 'Medium';
    } else if (mismatchPercentage < 10.0) {
        return 'High';
    } else {
        return 'Critical';
    }
}

/**
 * Compare multiple image pairs
 * @param {Array} imagePairs - Array of {baseline, current, diff} objects
 * @param {Object} options - Comparison options
 * @returns {Array} Array of comparison results
 */
async function compareMultiple(imagePairs, options = {}) {
    const results = [];

    for (const pair of imagePairs) {
        const result = compareImages(
            pair.baseline,
            pair.current,
            pair.diff,
            options
        );

        results.push({
            ...result,
            pageName: pair.pageName || path.basename(pair.baseline, '.png')
        });
    }

    return results;
}

/**
 * Generate comparison summary
 */
function generateSummary(results) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'pass').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const failed = results.filter(r => r.status === 'fail').length;

    const avgMismatch = results.reduce((sum, r) => sum + (r.mismatchPercentage || 0), 0) / total;

    return {
        total,
        passed,
        warnings,
        failed,
        passRate: parseFloat(((passed / total) * 100).toFixed(2)),
        avgMismatch: parseFloat(avgMismatch.toFixed(4)),
        status: failed > 0 ? 'FAILED' : warnings > 0 ? 'WARNING' : 'PASSED'
    };
}

/**
 * Get file size in KB
 */
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return parseFloat((stats.size / 1024).toFixed(2)); // KB
    } catch (err) {
        return 0;
    }
}

/**
 * Create side-by-side comparison image (optional advanced feature)
 */
function createSideBySide(baselinePath, currentPath, diffPath, outputPath) {
    try {
        // This is a placeholder for advanced feature
        // Would require image stitching with canvas or sharp
        console.log('Side-by-side comparison not yet implemented');
        return null;
    } catch (error) {
        console.error('Error creating side-by-side:', error.message);
        return null;
    }
}

module.exports = {
    compareImages,
    compareMultiple,
    generateSummary,
    determineStatus,
    determineSeverity,
    getFileSize,
    createSideBySide
};
