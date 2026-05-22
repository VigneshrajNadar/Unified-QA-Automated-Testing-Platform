/**
 * Swagger/OpenAPI Parser Service
 * Parses Swagger 2.0 and OpenAPI 3.x specifications
 */

const SwaggerParser = require('@apidevtools/swagger-parser');

/**
 * Parse Swagger/OpenAPI specification from URL or object
 * @param {String|Object} spec - Swagger URL or specification object
 * @returns {Object} Parsed API spec with paths
 */
async function parseSwaggerSpec(spec) {
    try {
        const api = await SwaggerParser.validate(spec);

        return {
            success: true,
            title: api.info?.title || 'Untitled API',
            version: api.info?.version || '1.0.0',
            description: api.info?.description || '',
            baseUrl: getBaseUrl(api),
            paths: api.paths || {}
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Extract base URL from Swagger spec
 * @param {Object} api - Parsed Swagger spec
 * @returns {String} Base URL
 */
function getBaseUrl(api) {
    // OpenAPI 3.x
    if (api.servers && api.servers.length > 0) {
        return api.servers[0].url;
    }

    // Swagger 2.0
    if (api.host) {
        const scheme = api.schemes?.[0] || 'https';
        const basePath = api.basePath || '';
        return `${scheme}://${api.host}${basePath}`;
    }

    return '';
}

/**
 * Convert Swagger paths to API requests array
 * @param {Object} paths - Swagger paths object
 * @param {String} baseUrl - Base URL for requests
 * @returns {Array} Array of request objects
 */
function convertPathsToRequests(paths, baseUrl) {
    const requests = [];

    for (const [path, pathItem] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(pathItem)) {
            // Skip non-method keys like 'parameters', 'summary', etc.
            if (!['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method)) {
                continue;
            }

            const url = baseUrl + path;
            const name = operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`;
            const description = operation.description || '';

            // Extract headers from parameters
            const headers = {};
            const queryParams = {};

            if (operation.parameters) {
                operation.parameters.forEach(param => {
                    if (param.in === 'header') {
                        headers[param.name] = param.example || `<${param.name}>`;
                    } else if (param.in === 'query' || param.in === 'path') {
                        queryParams[param.name] = param.example || param.default || `<${param.name}>`;
                    }
                });
            }

            // Get request body example (OpenAPI 3.x)
            let body = null;
            if (operation.requestBody && operation.requestBody.content) {
                const content = operation.requestBody.content['application/json'];
                if (content && content.example) {
                    body = JSON.stringify(content.example, null, 2);
                } else if (content && content.schema && content.schema.example) {
                    body = JSON.stringify(content.schema.example, null, 2);
                }
            }

            // Get expected status from responses
            const expected_status = operation.responses['200'] || operation.responses['201']
                ? (operation.responses['200'] ? 200 : 201)
                : null;

            // Generate schema from response (if available)
            let schema = null;
            const successResponse = operation.responses['200'] || operation.responses['201'];
            if (successResponse && successResponse.content) {
                const responseContent = successResponse.content['application/json'];
                if (responseContent && responseContent.schema) {
                    schema = JSON.stringify(responseContent.schema, null, 2);
                }
            } else if (successResponse && successResponse.schema) {
                // Swagger 2.0
                schema = JSON.stringify(successResponse.schema, null, 2);
            }

            if (body) {
                headers['Content-Type'] = 'application/json';
            }

            requests.push({
                name,
                description,
                method: method.toUpperCase(),
                url,
                headers: Object.keys(headers).length > 0 ? JSON.stringify(headers) : null,
                params: Object.keys(queryParams).length > 0 ? JSON.stringify(queryParams) : null,
                body,
                expected_status,
                schema,
                auth_type: 'none'
            });
        }
    }

    return requests;
}

module.exports = {
    parseSwaggerSpec,
    convertPathsToRequests
};
