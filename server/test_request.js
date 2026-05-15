const http = require('http');

console.log('Testing /monitors/2/history...');

http.get('http://localhost:5000/api/api-testing/monitors/2/history', (res) => {
    let data = '';

    console.log('Status Code:', res.statusCode);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', data);
    });

}).on('error', (err) => {
    console.log('Error: ' + err.message);
});
