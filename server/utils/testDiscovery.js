const fs = require('fs');
const path = require('path');

/**
 * Recursively find test files in a directory
 */
const findTestFiles = (dir, language, maxDepth = 5, currentDepth = 0) => {
    if (currentDepth > maxDepth) return [];

    const testFiles = [];
    const patterns = getTestPatterns(language);

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip node_modules, .git, etc.
            if (entry.name === 'node_modules' ||
                entry.name === '.git' ||
                entry.name === 'dist' ||
                entry.name === 'build' ||
                entry.name === 'coverage' ||
                entry.name === '.nyc_output') {
                continue;
            }

            if (entry.isDirectory()) {
                // Recursively search subdirectories
                testFiles.push(...findTestFiles(fullPath, language, maxDepth, currentDepth + 1));
            } else if (entry.isFile()) {
                // Check if file matches test patterns
                if (patterns.some(pattern => pattern.test(entry.name))) {
                    testFiles.push(fullPath);
                }
            }
        }
    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
    }

    return testFiles;
};

/**
 * Get test file patterns based on language
 */
const getTestPatterns = (language) => {
    const patterns = {
        'JavaScript/Node.js': [
            /\.test\.js$/,
            /\.spec\.js$/,
            /\.test\.ts$/,
            /\.spec\.ts$/,
            /\.test\.jsx$/,
            /\.spec\.jsx$/,
            /\.test\.tsx$/,
            /\.spec\.tsx$/,
            /__tests__\/.*\.(js|ts|jsx|tsx)$/
        ],
        'Python': [
            /^test_.*\.py$/,
            /.*_test\.py$/,
            /test.*\.py$/
        ],
        'Java': [
            /Test\.java$/,
            /Tests\.java$/,
            /TestCase\.java$/
        ]
    };

    return patterns[language] || patterns['JavaScript/Node.js'];
};

/**
 * Discover all tests in a project
 */
const discoverTests = (projectDir, language) => {
    const testFiles = findTestFiles(projectDir, language);

    return {
        totalFiles: testFiles.length,
        files: testFiles.map(f => ({
            path: f,
            relativePath: path.relative(projectDir, f),
            name: path.basename(f)
        }))
    };
};

module.exports = { discoverTests, findTestFiles };
