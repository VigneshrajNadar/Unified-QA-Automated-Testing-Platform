const fs = require('fs');
const path = require('path');
const escomplex = require('escomplex');

/**
 * Analyze code complexity for JavaScript files
 */
const analyzeComplexity = (projectDir) => {
    const results = [];

    try {
        const jsFiles = findJavaScriptFiles(projectDir);

        for (const file of jsFiles) {
            try {
                const code = fs.readFileSync(file, 'utf8');
                const analysis = escomplex.analyse(code);

                // Extract complexity metrics
                const fileMetrics = {
                    file: path.relative(projectDir, file),
                    complexity: analysis.aggregate.cyclomatic,
                    maintainability: Math.round(analysis.maintainability),
                    loc: analysis.aggregate.sloc.physical,
                    functions: analysis.functions.map(fn => ({
                        name: fn.name,
                        complexity: fn.cyclomatic,
                        loc: fn.sloc.physical,
                        params: fn.params
                    }))
                };

                results.push(fileMetrics);

            } catch (err) {
                console.error(`Error analyzing ${file}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Complexity analysis error:', err);
    }

    return results;
};

/**
 * Find JavaScript files in project
 */
const findJavaScriptFiles = (dir, files = [], depth = 0) => {
    if (depth > 5) return files;

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip common directories
            if (entry.name === 'node_modules' ||
                entry.name === '.git' ||
                entry.name === 'dist' ||
                entry.name === 'build' ||
                entry.name === 'coverage') {
                continue;
            }

            if (entry.isDirectory()) {
                findJavaScriptFiles(fullPath, files, depth + 1);
            } else if (entry.isFile() && /\.(js|jsx)$/.test(entry.name)) {
                files.push(fullPath);
            }
        }
    } catch (err) {
        console.error(`Error reading ${dir}:`, err);
    }

    return files;
};

module.exports = { analyzeComplexity };
