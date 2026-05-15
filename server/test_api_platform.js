const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/api-testing';

async function testBackend() {
    console.log('🚀 Starting Backend Sanity Check...\n');

    try {
        // 1. Get Collections
        console.log('1. Fetching Collections...');
        const colls = await axios.get(`${BASE_URL}/collections`);
        console.log(`✅ Found ${colls.data.length} collections.`);

        // Use ID 4 (or latest)
        let collectionId = 4;
        if (colls.data.length > 0) {
            collectionId = colls.data[colls.data.length - 1].collection_id;
            console.log(`👉 Using Collection ID: ${collectionId}`);
        } else {
            console.error('❌ No collections found! Create one first.');
            return;
        }

        // 2. Fetch Requests
        console.log(`\n2. Fetching Requests for Collection ${collectionId}...`);
        const collection = await axios.get(`${BASE_URL}/collections/${collectionId}`);
        console.log(`✅ Collection Name: "${collection.data.name}"`);
        console.log(`✅ Found ${collection.data.requests.length} requests.`);

        if (collection.data.requests.length === 0) {
            console.error('❌ No requests in this collection!');
            return;
        }

        const request = collection.data.requests[0];
        console.log(`👉 Testing Request: [${request.method}] ${request.url} (ID: ${request.request_id})`);

        // 3. Execute Request
        console.log('\n3. Executing Request...');
        const result = await axios.post(`${BASE_URL}/execute/${request.request_id}`);

        console.log('\n✅ EXECUTION SUCCESSFUL!');
        console.log('-----------------------------------');
        console.log(`Status Code: ${result.data.status_code}`);
        console.log(`Time: ${result.data.response_time_ms}ms`);
        console.log(`Success: ${result.data.success}`);
        console.log('Response Body Snippet:', String(result.data.response_body).substring(0, 100));
        console.log('-----------------------------------');

    } catch (error) {
        console.error('\n❌ TEST FAILED!');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testBackend();
