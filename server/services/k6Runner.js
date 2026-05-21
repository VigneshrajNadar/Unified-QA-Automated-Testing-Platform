const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const TEMP_DIR = path.join(__dirname, '../temp');
let K6_PATH = 'k6'; // Default to PATH

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function checkK6Availability() {
    return new Promise((resolve) => {
        // 1. Try default 'k6' command
        exec("k6 version", (err) => {
            if (!err) {
                K6_PATH = 'k6';
                return resolve(true);
            }
            // 2. Try common Windows and Linux paths
            const commonPaths = [
                path.join(__dirname, '../k6_bin'),
                'C:\\Program Files\\k6\\k6.exe',
                'C:\\Program Files (x86)\\k6\\k6.exe'
            ];

            for (const p of commonPaths) {
                if (fs.existsSync(p)) {
                    K6_PATH = p; // Store raw path
                    console.log(`k6 found at: ${p}`);
                    return resolve(true);
                }
            }

            console.error("k6 not found in PATH or common locations.");
            resolve(false);
        });
    });
}
// check availability on startup
checkK6Availability();

/**
 * Generates a k6 script and runs it.
 * @param {Object} config - { url, users, duration }
 * @returns {Promise<string>} - Path to the output JSON file
 */
async function runK6Test(config) {
    const isAvailable = await checkK6Availability();
    if (!isAvailable) {
        throw new Error("k6 is not installed on the server. Please install k6 to run load tests (e.g., 'choco install k6' or download from k6.io).");
    }

    const timestamp = Date.now();
    const scriptPath = path.join(TEMP_DIR, `test-${timestamp}.js`);
    const outputPath = path.join(TEMP_DIR, `output-${timestamp}.json`);

    // Dynamic Script Generation based on Test Type
    let k6Options = '';
    const vus = config.users || 10;
    const duration = config.duration || 30;

    switch (config.testType) {
        case 'stress':
            // Ramp up to even higher load to break system
            k6Options = `
              stages: [
                { duration: '${Math.floor(duration * 0.2)}s', target: ${Math.floor(vus * 0.5)} }, // Warm up
                { duration: '${Math.floor(duration * 0.4)}s', target: ${vus} }, // Load
                { duration: '${Math.floor(duration * 0.2)}s', target: ${Math.floor(vus * 1.5)} }, // Stress point
                { duration: '${Math.floor(duration * 0.2)}s', target: 0 }, // Cool down
              ],
            `;
            break;
        case 'spike':
            // Sudden extreme load
            k6Options = `
              stages: [
                { duration: '10s', target: ${Math.floor(vus * 0.1)} }, // Low load
                { duration: '10s', target: ${vus * 2} }, // SPIKE!
                { duration: '${Math.max(10, duration - 40)}s', target: ${vus * 2} }, // Sustain spike
                { duration: '10s', target: 0 }, // Recovery
              ],
            `;
            break;
        case 'soak':
            // Endurance test
            k6Options = `
              vus: ${vus},
              duration: '${duration}s',
            `;
            break;
        case 'load':
        default:
            // Standard load test
            k6Options = `
              vus: ${vus},
              duration: '${duration}s',
            `;
            break;
    }

    const scriptContent = `
import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  ${k6Options}
};

export default function () {
  http.get('${config.url}');
  sleep(1);
}
`;

    fs.writeFileSync(scriptPath, scriptContent);

    return new Promise((resolve, reject) => {
        console.log(`Starting k6 test: ${scriptPath} using ${K6_PATH}`);
        exec(`"${K6_PATH}" run --out json="${outputPath}" "${scriptPath}"`, (err, stdout, stderr) => {
            // Cleanup script file
            try {
                fs.unlinkSync(scriptPath);
            } catch (e) { console.error('Error cleanup script:', e); }

            if (err) {
                console.error("k6 execution failed:", stderr);
                return reject(new Error(`k6 execution failed: ${stderr}`));
            }

            console.log("k6 test completed.");
            resolve(outputPath);
        });
    });
}

module.exports = { runK6Test, checkK6Availability };
