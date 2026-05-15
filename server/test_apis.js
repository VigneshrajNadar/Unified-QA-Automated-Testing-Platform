const axios = require('axios');

async function testAPIs() {
    const baseURL = 'http://localhost:5000/api';

    // First login
    console.log('🔐 Logging in...');
    try {
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@meghana.com',
            password: 'admin123'
        });

        const token = loginRes.data.token;
        console.log('✅ Login successful! Token:', token.substring(0, 20) + '...');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // Test Projects
        console.log('\n📦 Testing Projects API...');
        const projectsRes = await axios.get(`${baseURL}/projects`, config);
        console.log(`✅ Found ${projectsRes.data.length} projects`);
        if (projectsRes.data.length > 0) {
            console.log('   First project:', projectsRes.data[0].name);
        }

        // Test Test Cases
        console.log('\n🧪 Testing Test Cases API...');
        const testCasesRes = await axios.get(`${baseURL}/testcases`, config);
        console.log(`✅ Found ${testCasesRes.data.length} test cases`);
        if (testCasesRes.data.length > 0) {
            console.log('   First test case:', testCasesRes.data[0].title);
        }

        // Test Defects
        console.log('\n🐛 Testing Defects API...');
        const defectsRes = await axios.get(`${baseURL}/defects`, config);
        console.log(`✅ Found ${defectsRes.data.length} defects`);
        if (defectsRes.data.length > 0) {
            console.log('   First defect:', defectsRes.data[0].title);
        }

        // Test Runs
        console.log('\n🏃 Testing Test Runs API...');
        const runsRes = await axios.get(`${baseURL}/runs`, config);
        console.log(`✅ Found ${runsRes.data.length} test runs`);
        if (runsRes.data.length > 0) {
            console.log('   First run:', runsRes.data[0].name);
        }

        console.log('\n✅ All APIs working! Data is available from backend.');
        console.log('\n⚠️ If frontend still shows no data:');
        console.log('   1. Hard refresh browser (Ctrl+Shift+R or Ctrl+F5)');
        console.log('   2. Clear browser cache');
        console.log('   3. Check browser console (F12) for errors');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testAPIs();
