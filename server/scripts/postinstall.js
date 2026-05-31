const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Only download k6 on Render or Linux
if (process.env.RENDER === 'true' || process.platform === 'linux') {
    console.log('Downloading k6 binary for Linux...');
    const url = 'https://github.com/grafana/k6/releases/download/v0.50.0/k6-v0.50.0-linux-amd64.tar.gz';
    
    // Check if curl and tar are available (they are on Render)
    const cmd = `curl -L ${url} | tar -xz && mv k6-v0.50.0-linux-amd64/k6 ./k6_bin && rm -rf k6-v0.50.0-linux-amd64`;
    
    exec(cmd, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
        if (error) {
            console.error('Failed to download k6:', error.message);
        } else {
            console.log('k6 downloaded successfully to k6_bin');
        }
    });
} else {
    console.log('Skipping k6 download (not on Render/Linux). Please ensure k6 is installed locally for performance testing.');
}
