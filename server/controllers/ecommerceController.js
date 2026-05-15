const ecommerceService = require('../services/ecommerceService');

exports.runTest = async (req, res) => {
    try {
        console.log('[EcommerceController] Request Body:', req.body);
        const { targetUrl, testType } = req.body;
        console.log('[EcommerceController] Type:', testType, 'URL:', targetUrl);
        const result = await ecommerceService.runTests(targetUrl, testType);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message, details: err.stderr });
    }
};

const fs = require('fs');
const path = require('path');
// const { xml2js } = require('xml-js'); // Removed to avoid dependency 
// Actually, let's keep it simple and just read the file and return basic stats if possible.
// Or better, let's just return the raw XML content and let Frontend parse, OR parse manually here.

exports.getReport = (req, res) => {
    const reportUrl = ecommerceService.getLatestReport();
    if (!reportUrl) {
        return res.status(404).json({ error: 'No report found.' });
    }

    // Try to read XML for dashboard data
    const xmlPath = path.join(__dirname, '../../ecommerce-automation/reports/result.xml');
    let summary = { tests: 0, failures: 0, time: 0 };

    if (fs.existsSync(xmlPath)) {
        const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
        // Simple regex parsing to avoid adding dependencies
        const testsMatch = xmlContent.match(/tests="(\d+)"/);
        const failuresMatch = xmlContent.match(/failures="(\d+)"/);
        const timeMatch = xmlContent.match(/time="([\d.]+)"/);

        summary = {
            tests: testsMatch ? parseInt(testsMatch[1]) : 0,
            failures: failuresMatch ? parseInt(failuresMatch[1]) : 0,
            time: timeMatch ? parseFloat(timeMatch[1]) : 0
        };
    }

    res.json({ reportUrl, summary });
};
