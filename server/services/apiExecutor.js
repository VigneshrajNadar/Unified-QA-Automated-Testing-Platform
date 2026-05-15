/**
 * API Request Executor Service
 * Executes HTTP requests and measures performance
 */

const axios = require('axios');

/**
 * Execute an API request
 * @param {Object} request - Request configuration
 * @returns {Object} Response with status, body, time, etc.
 */
async function executeApiRequest(request) {
    const startTime = Date.now();

    try {
        // Prepare headers
        const headers = request.headers ? JSON.parse(request.headers) : {};

        // Add authentication
        if (request.auth_type && request.auth_type !== 'none' && request.auth_value) {
            if (request.auth_type === 'bearer') {
                headers['Authorization'] = `Bearer ${request.auth_value}`;
            } else if (request.auth_type === 'apikey') {
                headers['X-API-Key'] = request.auth_value;
            } else if (request.auth_type === 'basic') {
                const [username, password] = request.auth_value.split(':');
                const encoded = Buffer.from(`${username}:${password}`).toString('base64');
                headers['Authorization'] = `Basic ${encoded}`;
            }
        }

        // Handle params (path + query)
        let finalUrl = request.url;
        let queryParams = {};

        if (request.params) {
            try {
                const params = JSON.parse(request.params);

                // Separate path params and query params
                Object.keys(params).forEach(key => {
                    const placeholder = `{${key}}`;
                    if (finalUrl.includes(placeholder)) {
                        // Replace path param
                        finalUrl = finalUrl.replace(placeholder, encodeURIComponent(params[key]));
                    } else {
                        // Add to query params
                        queryParams[key] = params[key];
                    }
                });
            } catch (e) {
                console.warn('Invalid params JSON:', request.params);
            }
        }

        // Prepare request config
        const config = {
            method: request.method.toLowerCase(),
            url: finalUrl,
            headers: headers,
            params: queryParams,
            timeout: 30000, // 30 second timeout
            validateStatus: () => true // Don't throw on any status code
        };

        // Add body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase()) && request.body) {
            try {
                config.data = JSON.parse(request.body);
            } catch (e) {
                // If not JSON, send as-is
                config.data = request.body;
            }
        }

        // Execute request
        const response = await axios(config);
        const responseTime = Date.now() - startTime;

        // Check if status matches expected (if specified)
        const statusMatch = request.expected_status
            ? response.status === request.expected_status
            : true;

        return {
            success: response.status >= 200 && response.status < 300 && statusMatch,
            status_code: response.status,
            response_time_ms: responseTime,
            response_body: JSON.stringify(response.data),
            response_headers: JSON.stringify(response.headers),
            error_message: null
        };

    } catch (error) {
        const responseTime = Date.now() - startTime;

        return {
            success: false,
            status_code: error.response?.status || 0,
            response_time_ms: responseTime,
            response_body: error.response?.data ? JSON.stringify(error.response.data) : null,
            response_headers: error.response?.headers ? JSON.stringify(error.response.headers) : null,
            error_message: error.message
        };
    }
}

/**
 * Execute multiple requests in sequence
 * @param {Array} requests - Array of request objects
 * @returns {Array} Array of results
 */
async function executeMultipleRequests(requests) {
    const results = [];

    for (const request of requests) {
        const result = await executeApiRequest(request);
        results.push({
            request_id: request.request_id,
            name: request.name,
            ...result
        });
    }

    return results;
}

module.exports = {
    executeApiRequest,
    executeMultipleRequests
};
