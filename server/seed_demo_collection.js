const db = require('./database');

console.log('🌱 Seeding Demo Collection (70% Pass / 30% Fail)...');

const collectionName = "Demo Test Suite (70/30 Split)";
const collectionDesc = "A generated collection to demonstrate passing and failing API tests.";

// 1. Create Collection
db.run(`INSERT INTO api_collections (name, description) VALUES (?, ?)`, [collectionName, collectionDesc], function (err) {
    if (err) {
        console.error('Error creating collection:', err.message);
        process.exit(1);
    }

    const collectionId = this.lastID;
    console.log(`✅ Created Collection ID: ${collectionId}`);

    // Define 10 Requests
    const requests = [
        // --- PASSING REQUESTS (7) ---
        {
            name: "1. Get Posts (Pass)",
            method: "GET",
            url: "https://jsonplaceholder.typicode.com/posts/1",
            expected_status: 200,
            description: "Fetches a simple post. Should Pass."
        },
        {
            name: "2. Get User (Pass)",
            method: "GET",
            url: "https://reqres.in/api/users/2",
            expected_status: 200,
            description: "Fetches a user profile. Should Pass."
        },
        {
            name: "3. List Resources (Pass)",
            method: "GET",
            url: "https://reqres.in/api/unknown",
            expected_status: 200,
            description: "Lists resources. Should Pass."
        },
        {
            name: "4. Create Post (Pass)",
            method: "POST",
            url: "https://jsonplaceholder.typicode.com/posts",
            body: JSON.stringify({ title: 'foo', body: 'bar', userId: 1 }),
            headers: JSON.stringify({ "Content-type": "application/json; charset=UTF-8" }),
            expected_status: 201,
            description: "Creates a resource. Should Pass (201)."
        },
        {
            name: "5. HttpBin Status 200 (Pass)",
            method: "GET",
            url: "https://httpbin.org/status/200",
            expected_status: 200,
            description: "Force return 200 OK. Should Pass."
        },
        {
            name: "6. HttpBin Headers (Pass)",
            method: "GET",
            url: "https://httpbin.org/headers",
            headers: JSON.stringify({ "X-Test-Custom": "MyValue" }),
            expected_status: 200,
            description: "Echoes headers. Should Pass."
        },
        {
            name: "7. Google Homepage (Pass)",
            method: "GET",
            url: "https://www.google.com",
            expected_status: 200,
            description: "Simple GET to google. Should Pass."
        },

        // --- FAILING REQUESTS (3) ---
        {
            name: "8. Broken URL (Fail)",
            method: "GET",
            url: "https://reqres.in/api/users/232323",
            expected_status: 200,
            description: "User does not exist. Returns 404, but we expect 200. FAIL."
        },
        {
            name: "9. Server Error (Fail)",
            method: "GET",
            url: "https://httpbin.org/status/500",
            expected_status: 200,
            description: "Server returns 500. We expect 200. FAIL."
        },
        {
            name: "10. Bad Request Body (Fail)",
            method: "POST",
            url: "https://reqres.in/api/login",
            body: JSON.stringify({ "email": "peter@klaven" }), // Missing password
            headers: JSON.stringify({ "Content-Type": "application/json" }),
            expected_status: 200,
            description: "Missing password. Returns 400. We expect 200. FAIL."
        }
    ];

    let inserted = 0;
    requests.forEach(req => {
        const sql = `
            INSERT INTO api_requests 
            (collection_id, name, method, url, headers, body, params, auth_type, expected_status, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [
            collectionId,
            req.name,
            req.method,
            req.url,
            req.headers || null,
            req.body || null,
            null, // params
            'none', // auth_type
            req.expected_status,
            req.description
        ], (err) => {
            if (err) console.error(`Error adding ${req.name}:`, err.message);
            else console.log(`  + Added: ${req.name}`);

            inserted++;
            if (inserted === requests.length) {
                console.log('\n✅ Demo Collection Ready!');
                process.exit(0);
            }
        });
    });
});
