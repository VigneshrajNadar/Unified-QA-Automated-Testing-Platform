/**
 * JSON Schema Validator Service
 * Uses AJV for validating API responses against JSON Schema
 */

const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, strict: false });

/**
 * Validate response body against JSON Schema
 * @param {Object|String} schema - JSON Schema (object or JSON string)
 * @param {Object|String} responseBody - Response to validate (object or JSON string)
 * @returns {Object} Validation result with isValid and errors
 */
function cleanMongooseIds(obj, visited = new WeakSet()) {
    if (obj !== null && typeof obj === 'object') {
        if (visited.has(obj)) return;
        visited.add(obj);

        if (Array.isArray(obj)) {
            obj.forEach(item => cleanMongooseIds(item, visited));
        } else {
            if (obj._id) delete obj._id;
            if (obj.id && (typeof obj.id !== 'string' || obj.id.length === 24)) delete obj.id;
            
            for (const key in obj) {
                if (typeof obj[key] === 'object') {
                    cleanMongooseIds(obj[key], visited);
                }
            }
        }
    }
}

function validateSchema(schema, responseBody) {
    try {
        // Parse if strings, and make sure it's a plain object to avoid Mongoose virtuals
        const schemaObj = typeof schema === 'string' ? JSON.parse(schema) : JSON.parse(JSON.stringify(schema));
        const dataObj = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;

        cleanMongooseIds(schemaObj);

        // Compile schema
        const validate = ajv.compile(schemaObj);

        // Validate
        const isValid = validate(dataObj);

        return {
            isValid,
            errors: isValid ? [] : validate.errors
        };

    } catch (error) {
        return {
            isValid: false,
            errors: [{
                message: `Schema validation error: ${error.message}`
            }]
        };
    }
}

/**
 * Create a basic JSON Schema from example response
 * Useful for auto-generating schemas
 * @param {Object} example - Example response object
 * @returns {Object} JSON Schema
 */
function generateSchemaFromExample(example) {
    function inferType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    function buildSchema(obj) {
        if (obj === null) {
            return { type: 'null' };
        }

        if (Array.isArray(obj)) {
            return {
                type: 'array',
                items: obj.length > 0 ? buildSchema(obj[0]) : {}
            };
        }

        if (typeof obj === 'object') {
            const properties = {};
            const required = [];

            for (const [key, value] of Object.entries(obj)) {
                properties[key] = buildSchema(value);
                required.push(key);
            }

            return {
                type: 'object',
                properties,
                required
            };
        }

        return { type: inferType(obj) };
    }

    return buildSchema(example);
}

module.exports = {
    validateSchema,
    generateSchemaFromExample
};
