const fs = require('fs');
const path = require('path');

/**
 * Detect project type and configuration
 */
const detectProject = (projectDir) => {
    const result = {
        language: null,
        framework: null,
        testCommand: null,
        installCommand: null,
        packageManager: null,
        hasTests: false
    };

    // Check for Node.js
    if (fs.existsSync(path.join(projectDir, 'package.json'))) {
        result.language = 'JavaScript/Node.js';
        result.packageManager = 'npm';
        result.installCommand = 'npm install';

        try {
            const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'));

            // Detect framework
            if (pkg.dependencies?.react || pkg.devDependencies?.react) {
                result.framework = 'React';
            } else if (pkg.dependencies?.express) {
                result.framework = 'Express';
            } else if (pkg.dependencies?.next) {
                result.framework = 'Next.js';
            }

            // Detect test command
            if (pkg.scripts?.test) {
                result.testCommand = 'npm test';
                result.hasTests = true;
            }

            // Check for yarn
            if (fs.existsSync(path.join(projectDir, 'yarn.lock'))) {
                result.packageManager = 'yarn';
                result.installCommand = 'yarn install';
                if (pkg.scripts?.test) {
                    result.testCommand = 'yarn test';
                }
            }
        } catch (e) {
            console.error('Error parsing package.json:', e);
        }
    }

    // Check for Python
    else if (fs.existsSync(path.join(projectDir, 'requirements.txt')) ||
        fs.existsSync(path.join(projectDir, 'setup.py')) ||
        fs.existsSync(path.join(projectDir, 'pyproject.toml'))) {
        result.language = 'Python';
        result.packageManager = 'pip';
        result.installCommand = 'pip install -r requirements.txt';
        result.testCommand = 'pytest';

        // Check if pytest is likely available
        if (fs.existsSync(path.join(projectDir, 'tests')) ||
            fs.existsSync(path.join(projectDir, 'test'))) {
            result.hasTests = true;
        }
    }

    // Check for Java
    else if (fs.existsSync(path.join(projectDir, 'pom.xml'))) {
        result.language = 'Java';
        result.framework = 'Maven';
        result.packageManager = 'maven';
        result.installCommand = 'mvn install';
        result.testCommand = 'mvn test';
        result.hasTests = true;
    }
    else if (fs.existsSync(path.join(projectDir, 'build.gradle'))) {
        result.language = 'Java';
        result.framework = 'Gradle';
        result.packageManager = 'gradle';
        result.installCommand = 'gradle build';
        result.testCommand = 'gradle test';
        result.hasTests = true;
    }

    return result;
};

module.exports = { detectProject };
