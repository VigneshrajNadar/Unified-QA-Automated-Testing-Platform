/**
 * Seed Visual Testing Demo Data
 * Creates a sample visual test project with baseline and comparison runs
 */

const db = require('./database');

console.log('🎨 Seeding Visual Testing Demo Data...');

// Create sample visual project
const projectSql = `INSERT INTO visual_projects (project_id, base_url, name) VALUES (1, 'https://example.com', 'Example Website Test')`;

db.run(projectSql, function (err) {
    if (err) {
        console.log('ℹ️  Visual project already exists or error:', err.message);
    } else {
        console.log('✅ Created sample visual project');

        const visual_project_id = this.lastID;

        // Create baseline run
        const baselineRunSql = `INSERT INTO visual_runs 
            (visual_project_id, run_type, browser, viewport, status, total_screenshots, created_at) 
            VALUES (?, 'baseline', 'chrome', 'desktop', 'completed', 1, datetime('now', '-2 hours'))`;

        db.run(baselineRunSql, [visual_project_id], function (err) {
            if (err) {
                console.log('Error creating baseline run:', err.message);
            } else {
                console.log('✅ Created sample baseline run');
                const baseline_run_id = this.lastID;

                // Create baseline screenshot record
                const screenshotSql = `INSERT INTO visual_screenshots 
                    (run_id, page_url, page_name, image_path) 
                    VALUES (?, 'https://example.com', 'home', 'uploads/visual-tests/baselines/vp_1/home_chrome_desktop.png')`;

                db.run(screenshotSql, [baseline_run_id], function (err) {
                    if (err) {
                        console.log('Error creating screenshot:', err.message);
                    } else {
                        console.log('✅ Created baseline screenshot record');

                        // Create baseline image record
                        const baselineImageSql = `INSERT INTO baseline_images 
                            (visual_project_id, page_url, page_name, browser, viewport, image_path) 
                            VALUES (?, 'https://example.com', 'home', 'chrome', 'desktop', 'uploads/visual-tests/baselines/vp_1/home_chrome_desktop.png')`;

                        db.run(baselineImageSql, [visual_project_id], function (err) {
                            if (err) {
                                console.log('Error creating baseline image:', err.message);
                            } else {
                                console.log('✅ Created baseline image record');
                                const baseline_id = this.lastID;

                                // Create comparison run
                                const comparisonRunSql = `INSERT INTO visual_runs 
                                    (visual_project_id, run_type, browser, viewport, status, total_screenshots, total_diffs, passed, failed, created_at) 
                                    VALUES (?, 'comparison', 'chrome', 'desktop', 'completed', 1, 1, 1, 0, datetime('now', '-30 minutes'))`;

                                db.run(comparisonRunSql, [visual_project_id], function (err) {
                                    if (err) {
                                        console.log('Error creating comparison run:', err.message);
                                    } else {
                                        console.log('✅ Created sample comparison run');
                                        const comparison_run_id = this.lastID;

                                        // Create current screenshot
                                        const currentScreenshotSql = `INSERT INTO visual_screenshots 
                                            (run_id, page_url, page_name, image_path) 
                                            VALUES (?, 'https://example.com', 'home', 'uploads/visual-tests/current/run_${comparison_run_id}/home_chrome_desktop.png')`;

                                        db.run(currentScreenshotSql, [comparison_run_id], function (err) {
                                            if (err) {
                                                console.log('Error creating current screenshot:', err.message);
                                            } else {
                                                console.log('✅ Created current screenshot record');
                                                const current_screenshot_id = this.lastID;

                                                // Create diff record
                                                const diffSql = `INSERT INTO visual_diffs 
                                                    (run_id, baseline_image_id, current_image_id, page_url, page_name, diff_image_path, mismatch_pixels, mismatch_percentage, status, severity) 
                                                    VALUES (?, ?, ?, 'https://example.com', 'home', 'uploads/visual-tests/diffs/run_${comparison_run_id}/home_diff.png', 1250, 0.15, 'pass', 'Low')`;

                                                db.run(diffSql, [comparison_run_id, baseline_id, current_screenshot_id], function (err) {
                                                    if (err) {
                                                        console.log('Error creating diff:', err.message);
                                                    } else {
                                                        console.log('✅ Created diff record');
                                                        console.log('\n🎉 Visual Testing Demo Data Seeded Successfully!');
                                                        console.log('\n📊 Sample Data Created:');
                                                        console.log('   - 1 Visual Project: "Example Website Test"');
                                                        console.log('   - 1 Baseline Run (2 hours ago)');
                                                        console.log('   - 1 Comparison Run (30 min ago)');
                                                        console.log('   - 1 Diff Result: PASS (0.15% mismatch)');
                                                        console.log('\n💡 Note: Actual screenshot images are not created.');
                                                        console.log('   The UI will show "Image not found" placeholders.');
                                                        console.log('   To see real screenshots, run an actual test!');
                                                        process.exit(0);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});
