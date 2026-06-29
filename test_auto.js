const axios = require('axios');
const FormData = require('form-data');

async function test() {
    try {
        const formData = new FormData();
        formData.append('projectId', 'temp');
        formData.append('gitUrl', 'https://github.com/VigneshrajNadar/Unified-QA-Automated-Testing-Platform');
        formData.append('selectedTests', JSON.stringify(["unit"]));

        const res = await axios.post('http://localhost:5000/api/autotest/execute', formData, {
            headers: formData.getHeaders()
        });
        console.log("SUCCESS:");
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.log("ERROR:");
        if (err.response) {
            console.log(JSON.stringify(err.response.data, null, 2));
        } else {
            console.log(err.message);
        }
    }
}
test();
