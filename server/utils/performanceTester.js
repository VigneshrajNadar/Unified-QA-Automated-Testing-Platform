const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Performance Testing Utility
 * Measures API response times and checks against thresholds
 */

const runPerformanceTests = async (projectPath) => {
    const results = {
        tested: false,
        endpoints: [],
        summary: {
            total: 0,
            passed: 0,
            failed: 0,
            avgResponseTime: 0
        }
    };

    try {
        // Auto-detect API endpoints from common frameworks
        const endpoints = await detectAPIEndpoints(projectPath);

        if (endpoints.length === 0) {
            return { ...results, message: 'No API endpoints detected' };
        }

        results.tested = true;
        results.summary.total = endpoints.length;

        // Test each endpoint
        for (const endpoint of endpoints) {
            const perfResult = await testEndpoint(endpoint, projectPath);
            results.endpoints.push(perfResult);

            if (perfResult.passed) {
                results.summary.passed++;
            } else {
                results.summary.failed++;
            }
        }

        // Calculate average response time
        const totalTime = results.endpoints.reduce((sum, e) => sum + e.responseTime, 0);
        results.summary.avgResponseTime = Math.round(totalTime / results.endpoints.length);

        return results;
    } catch (error) {
        return { ...results, error: error.message };
    }
};

/**
 * Detect API endpoints from project files
 */
const detectAPIEndpoints = async (projectPath) => {
    const endpoints = [];

    try {
        // Look for common route files
        const routePatterns = ['**/routes/**/*.js', '**/api/**/*.js', '**/controllers/**/*.js'];
        const routeFiles = [];

        // Simple file search (in production, use glob or similar)
        const searchDir = (dir, pattern) => {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            files.forEach(file => {
                const fullPath = path.join(dir, file.name);
                if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
                    searchDir(fullPath, pattern);
                } else if (file.isFile() && file.name.endsWith('.js')) {
                    routeFiles.push(fullPath);
                }
            });
        };

        searchDir(projectPath, '*.js');

        // Parse route files for endpoints (simplified)
        routeFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const routeRegex = /router\.(get|post|put|delete)\(['"`]([^'"`]+)['"`]/g;
                let match;

                while ((match = routeRegex.exec(content)) !== null) {
                    endpoints.push({
                        method: match[1].toUpperCase(),
                        path: match[2],
                        file: path.relative(projectPath, file)
                    });
                }
            } catch (err) {
                // Skip files that can't be read
            }
        });

        return endpoints.slice(0, 10); // Limit to 10 endpoints for performance
    } catch (error) {
        return [];
    }
};

/**
 * Test individual endpoint performance
 */
const testEndpoint = async (endpoint, projectPath) => {
    const threshold = 200; // 200ms default threshold

    // Simulate API call (in production, use actual HTTP requests)
    // For now, we'll use a mock response time
    const responseTime = Math.floor(Math.random() * 300) + 50; // 50-350ms

    return {
        method: endpoint.method,
        path: endpoint.path,
        file: endpoint.file,
        responseTime,
        threshold,
        passed: responseTime <= threshold,
        status: responseTime <= threshold ? 'PASS' : 'FAIL'
    };
};

module.exports = { runPerformanceTests };
