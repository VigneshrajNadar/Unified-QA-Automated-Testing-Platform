const db = require('../database');

/**
 * Regression Testing Utility
 * Compares current test results with previous runs to detect regressions
 */

const runRegressionTests = async (projectId, currentResults) => {
    const results = {
        tested: false,
        regressions: [],
        improvements: [],
        summary: {
            totalRegressions: 0,
            totalImprovements: 0,
            comparedWithRun: null
        }
    };

    try {
        // Get the most recent previous run for this project
        const previousRun = await getPreviousRun(projectId);

        if (!previousRun) {
            return { ...results, message: 'No previous run found for comparison' };
        }

        results.tested = true;
        results.summary.comparedWithRun = previousRun.test_run_id;

        // Get previous defects
        const previousDefects = await getDefectsForRun(previousRun.test_run_id);
        const currentDefects = currentResults.defects || [];

        // Detect regressions (new defects)
        currentDefects.forEach(currentDefect => {
            const existedBefore = previousDefects.some(
                prev => prev.title === currentDefect.title
            );

            if (!existedBefore) {
                results.regressions.push({
                    title: currentDefect.title,
                    severity: currentDefect.severity,
                    type: 'New Defect',
                    description: currentDefect.description
                });
            }
        });

        // Detect improvements (fixed defects)
        previousDefects.forEach(previousDefect => {
            const stillExists = currentDefects.some(
                curr => curr.title === previousDefect.title
            );

            if (!stillExists && previousDefect.status !== 'Closed') {
                results.improvements.push({
                    title: previousDefect.title,
                    severity: previousDefect.severity,
                    type: 'Fixed Defect',
                    description: previousDefect.description
                });
            }
        });

        results.summary.totalRegressions = results.regressions.length;
        results.summary.totalImprovements = results.improvements.length;

        return results;
    } catch (error) {
        return { ...results, error: error.message };
    }
};

/**
 * Get the most recent previous run for a project
 */
const getPreviousRun = (projectId) => {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM test_runs 
             WHERE project_id = ? 
             ORDER BY executed_at DESC 
             LIMIT 1 OFFSET 1`,
            [projectId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });
};

/**
 * Get defects for a specific run
 */
const getDefectsForRun = (runId) => {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM defects WHERE test_run_id = ?',
            [runId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
};

module.exports = { runRegressionTests };
