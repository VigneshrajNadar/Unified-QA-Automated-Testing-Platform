const axios = require('axios');

async function testUniversal() {
    try {
        console.log('Testing Universal Mode API...');
        const res = await axios.post('http://localhost:5000/api/ecommerce/run', {
            targetUrl: 'https://www.google.com'
        });
        console.log('Response:', res.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

testUniversal();
