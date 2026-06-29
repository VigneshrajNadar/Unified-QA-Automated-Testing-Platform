/**
 * API Request Executor Service
 * Executes HTTP requests and measures performance
 */

const axios = require('axios');

/**
 * Execute an API request
 * @param {Object} request - Request configuration
 * @param {Object} envVars - Key-value map of environment variables
 * @returns {Object} Response with status, body, time, etc.
 */
async function executeApiRequest(request, envVars = {}) {
    const startTime = Date.now();

    // Helper to replace {{var}} patterns
    const injectVars = (str) => {
        if (!str || typeof str !== 'string') return str;
        return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            return envVars[key.trim()] !== undefined ? envVars[key.trim()] : match;
        });
    };

    try {
        // Prepare headers
        let headers = {};
        if (request.headers) {
            try {
                headers = typeof request.headers === 'string' ? JSON.parse(request.headers) : request.headers;
            } catch (e) {
                console.warn('Invalid headers JSON:', request.headers);
            }
        }

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
        let finalUrl = injectVars(request.url);
        let queryParams = {};

        if (request.params) {
            try {
                const params = typeof request.params === 'string' ? JSON.parse(request.params) : request.params;

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

        let requestBody = undefined;
        if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
            try {
                const bodyStr = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
                requestBody = JSON.parse(injectVars(bodyStr));
            } catch (e) {
                // If it fails to parse as JSON, send as string
                requestBody = injectVars(request.body);
            }
        }
        if (requestBody !== undefined) config.data = requestBody;

        // Apply to headers as well
        Object.keys(headers).forEach(key => {
            if (typeof headers[key] === 'string') {
                headers[key] = injectVars(headers[key]);
            }
        });

        // Execute request
        const response = await axios(config);
        const responseTime = Date.now() - startTime;

        // Check if status matches expected (if specified)
        const statusMatch = request.expected_status
            ? response.status === Number(request.expected_status)
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
 * @param {Object} envVars - Key-value map of environment variables
 * @returns {Array} Array of results
 */
async function executeMultipleRequests(requests, envVars = {}) {
    const results = [];
    
    for (const req of requests) {
        const result = await executeApiRequest(req, envVars);
        results.push({
            request_id: req.request_id,
            name: req.name,
            ...result
        });
    }

    return results;
}

module.exports = {
    executeApiRequest,
    executeMultipleRequests
};
