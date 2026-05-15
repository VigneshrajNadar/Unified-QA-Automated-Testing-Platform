/**
 * Enhanced AI-Based Test Case Generator
 * Generates realistic, context-specific test cases
 */

class AITestCaseGenerator {
    constructor() {
        // Validation patterns
        this.patterns = {
            email: /\b(email|e-mail)\b/i,
            password: /\b(password|pwd)\b/i,
            phone: /\b(phone|mobile|contact)\b/i,
            required: /\b(required|mandatory|must|shall)\b/i,
            unique: /\b(unique)\b/i,
            minLength: /at least (\d+) character/i,
            hasUppercase: /uppercase|capital/i,
            hasLowercase: /lowercase/i,
            hasNumber: /number|digit/i,
            hasSpecial: /special character/i
        };
    }

    async generateFromRequirement(requirement) {
        // Analyze the requirement
        const analysis = this.analyzeRequirement(requirement);
        const testCases = [];

        // Generate tests based on analysis
        if (analysis.hasEmail || analysis.hasPassword) {
            testCases.push(...this.generateFormTests(analysis));
        } else {
            testCases.push(...this.generateGenericTests(analysis));
        }

        testCases.push(...this.generateSecurityTests(analysis));

        return {
            testCases,
            confidence: this.calculateConfidence(requirement, testCases, analysis),
            summary: {
                total: testCases.length,
                positive: testCases.filter(t => t.category === 'positive').length,
                negative: testCases.filter(t => t.category === 'negative').length,
                boundary: testCases.filter(t => t.category === 'boundary').length,
                edge: testCases.filter(t => t.category === 'edge_case').length
            }
        };
    }

    analyzeRequirement(text) {
        const lowerText = text.toLowerCase();
        const firstLine = text.split('\n')[0].trim();

        // Extract feature name
        let featureName = 'Feature';
        if (firstLine.match(/^(feature|story):/i)) {
            featureName = firstLine.replace(/^(feature|story):\s*/i, '').trim();
        } else if (firstLine.length < 100 && !firstLine.endsWith('.')) {
            featureName = firstLine.replace(/:$/, '');
        }

        // Check for fields
        const hasEmail = this.patterns.email.test(text);
        const hasPassword = this.patterns.password.test(text);
        const hasPhone = this.patterns.phone.test(text);

        // Extract password requirements
        let passwordMinLength = 8;
        let passwordRequirements = [];
        if (hasPassword) {
            const minMatch = text.match(this.patterns.minLength);
            if (minMatch) passwordMinLength = parseInt(minMatch[1]);

            if (this.patterns.hasUppercase.test(text)) passwordRequirements.push('1 uppercase');
            if (this.patterns.hasLowercase.test(text)) passwordRequirements.push('1 lowercase');
            if (this.patterns.hasNumber.test(text)) passwordRequirements.push('1 number');
            if (this.patterns.hasSpecial.test(text)) passwordRequirements.push('1 special char');
        }

        // Extract actions
        const actions = [];
        const actionWords = ['register', 'login', 'create', 'update', 'delete', 'submit'];
        actionWords.forEach(word => {
            if (lowerText.includes(word)) actions.push(word);
        });

        return {
            featureName,
            hasEmail,
            hasPassword,
            hasPhone,
            passwordMinLength,
            passwordRequirements,
            actions,
            isRequired: this.patterns.required.test(text),
            isUnique: this.patterns.unique.test(text)
        };
    }

    generateFormTests(analysis) {
        const tests = [];
        const { featureName, hasEmail, hasPassword, passwordMinLength, passwordRequirements } = analysis;

        // Positive test with all valid fields
        const fields = [];
        if (hasEmail) fields.push('email: john.doe@example.com');
        if (hasPassword) fields.push('password: SecureP@ss123');

        tests.push({
            title: `Verify successful ${featureName} with all valid data`,
            description: `Complete ${featureName} flow with valid ${hasEmail ? 'email' : ''}${hasEmail && hasPassword ? ' and ' : ''}${hasPassword ? 'password' : ''}`,
            category: 'positive',
            priority: 'Critical',
            type: 'Functional',
            steps: [
                `1. Navigate to ${featureName} page`,
                ...fields.map((f, i) => `${i + 2}. Enter valid ${f}`),
                `${fields.length + 2}. Click Submit button`,
                `${fields.length + 3}. Verify success message`,
                `${fields.length + 4}. Verify ${featureName} completes successfully`
            ],
            expectedResult: `${featureName} should complete successfully with confirmation message`,
            testData: { email: 'john.doe@example.com', password: 'SecureP@ss123' }
        });

        // Email validation tests
        if (hasEmail) {
            tests.push({
                title: `Verify ${featureName} rejects invalid email format`,
                description: `Test email validation with various invalid formats`,
                category: 'negative',
                priority: 'High',
                type: 'Validation',
                steps: [
                    `1. Enter invalid email: "invalid-email"`,
                    `2. Fill other required fields`,
                    `3. Attempt to submit`,
                    `4. Verify validation error appears`,
                    `5. Try "user@" - verify error`,
                    `6. Try "user@domain" - verify error`
                ],
                expectedResult: `Each invalid email format should show "Please enter a valid email" error`,
                testData: {
                    invalidEmails: ['invalid-email', 'user@', 'user@domain', '@domain.com']
                }
            });

            tests.push({
                title: `Verify ${featureName} fails with empty email`,
                description: `Test that email field validation prevents empty submission`,
                category: 'negative',
                priority: 'High',
                type: 'Validation',
                steps: [
                    `1. Navigate to ${featureName} form`,
                    `2. Leave email field empty`,
                    `3. Fill other fields`,
                    `4. Click Submit`,
                    `5. Verify "Email is required" error`,
                    `6. Verify form is not submitted`
                ],
                expectedResult: `Error message "Email is required" should be displayed`,
                testData: { email: '' }
            });
        }

        // Password validation tests
        if (hasPassword) {
            tests.push({
                title: `Verify ${featureName} enforces password complexity requirements`,
                description: `Test password validation: ${passwordRequirements.join(', ')}`,
                category: 'negative',
                priority: 'High',
                type: 'Security',
                steps: [
                    `1. Enter password with only ${passwordMinLength - 1} characters`,
                    `2. Verify error: "Password must be at least ${passwordMinLength} characters"`,
                    passwordRequirements.includes('1 uppercase') && `3. Try password without uppercase: "test@123"`,
                    passwordRequirements.includes('1 lowercase') && `4. Try password without lowercase: "TEST@123"`,
                    passwordRequirements.includes('1 number') && `5. Try password without number: "Test@abc"`,
                    `6. Verify specific error for each violation`
                ].filter(Boolean),
                expectedResult: `Password validation should enforce: ${passwordMinLength}+ chars, ${passwordRequirements.join(', ')}`,
                testData: {
                    weakPasswords: [
                        { value: 'a'.repeat(passwordMinLength - 1), error: 'too short' },
                        { value: 'test@123', error: 'no uppercase' },
                        { value: 'TEST@123', error: 'no lowercase' },
                        { value: 'Test@abc', error: 'no number' }
                    ]
                }
            });

            // Boundary tests for password
            tests.push({
                title: `Verify password accepts exactly ${passwordMinLength} characters`,
                description: `Boundary test for minimum password length`,
                category: 'boundary',
                priority: 'Medium',
                type: 'Boundary',
                steps: [
                    `1. Enter password with exactly ${passwordMinLength} characters meeting all requirements`,
                    `2. Submit the form`,
                    `3. Verify password is accepted`,
                    `4. Verify no validation errors`
                ],
                expectedResult: `Password with minimum length should be accepted`,
                testData: { password: 'A'.repeat(passwordMinLength) }
            });

            tests.push({
                title: `Verify password rejects ${passwordMinLength - 1} characters`,
                description: `Boundary test for password length minus 1`,
                category: 'boundary',
                priority: 'Medium',
                type: 'Boundary',
                steps: [
                    `1. Enter password with ${passwordMinLength - 1} characters`,
                    `2. Attempt to submit`,
                    `3. Verify validation error`,
                    `4. Verify form not submitted`
                ],
                expectedResult: `Should show "Password must be at least ${passwordMinLength} characters"`,
                testData: { password: 'A'.repeat(passwordMinLength - 1) }
            });
        }

        return tests;
    }

    generateGenericTests(analysis) {
        const tests = [];
        const { featureName, actions } = analysis;

        actions.slice(0, 2).forEach(action => {
            tests.push({
                title: `Verify ${action} operation with valid data`,
                description: `Test successful ${action} with all required fields`,
                category: 'positive',
                priority: 'High',
                type: 'Functional',
                steps: [
                    `1. Navigate to ${action} page`,
                    `2. Enter all required valid data`,
                    `3. Click ${action} button`,
                    `4. Verify success message`,
                    `5. Verify ${action} completes successfully`
                ],
                expectedResult: `${action} operation should complete successfully`,
                testData: { action, status: 'valid' }
            });

            tests.push({
                title: `Verify ${action} fails with invalid data`,
                description: `Test ${action} with invalid inputs`,
                category: 'negative',
                priority: 'High',
                type: 'Functional',
                steps: [
                    `1. Navigate to ${action} page`,
                    `2. Enter invalid data`,
                    `3. Click ${action} button`,
                    `4. Verify error message`,
                    `5. Verify operation does not complete`
                ],
                expectedResult: `Error message should be displayed`,
                testData: { action, status: 'invalid' }
            });
        });

        return tests;
    }

    generateSecurityTests(analysis) {
        const tests = [];
        const { featureName } = analysis;

        tests.push({
            title: `Verify ${featureName} prevents SQL injection`,
            description: `Security test for SQL injection attempts`,
            category: 'edge_case',
            priority: 'Critical',
            type: 'Security',
            steps: [
                `1. Enter SQL payload: "'; DROP TABLE users; --"`,
                `2. Attempt to submit`,
                `3. Verify input is sanitized`,
                `4. Verify no database errors`,
                `5. Verify system integrity maintained`
            ],
            expectedResult: `SQL injection should be prevented with proper sanitization`,
            testData: {
                sqlPayloads: ["'; DROP TABLE users; --", "' OR '1'='1", "admin'--"]
            }
        });

        tests.push({
            title: `Verify ${featureName} prevents XSS attacks`,
            description: `Test Cross-Site Scripting prevention`,
            category: 'edge_case',
            priority: 'Critical',
            type: 'Security',
            steps: [
                `1. Enter XSS payload: "<script>alert('XSS')</script>"`,
                `2. Submit the form`,
                `3. Verify script is not executed`,
                `4. Verify input is HTML-encoded`,
                `5. Check no alert popup appears`
            ],
            expectedResult: `XSS payloads should be neutralized, no script execution`,
            testData: {
                xssPayloads: ["<script>alert('XSS')</script>", "<img src=x onerror=alert('XSS')>"]
            }
        });

        return tests;
    }

    calculateConfidence(source, testCases, analysis) {
        let score = 0.4;

        if (source.length > 100) score += 0.1;
        if (source.length > 300) score += 0.1;
        if (testCases.length >= 5) score += 0.1;
        if (testCases.length >= 10) score += 0.1;
        if (analysis.hasEmail || analysis.hasPassword) score += 0.1;

        const categories = new Set(testCases.map(t => t.category));
        score += (categories.size * 0.05);

        return Math.min(score, 0.95);
    }

    // User Story generation
    async generateFromUserStory(userStory) {
        const testCases = [];
        const parsed = this.parseUserStory(userStory);

        if (parsed) {
            testCases.push(...this.generateAcceptanceCriteria(parsed));
            testCases.push(...this.generateGherkin(parsed));
        }

        return {
            testCases,
            confidence: this.calculateConfidence(userStory, testCases, {}),
            gherkin: testCases.filter(t => t.gherkin).map(t => t.gherkin).join('\n\n')
        };
    }

    parseUserStory(userStory) {
        const regex = /As a (.+?), I want (.+?), so that (.+)/i;
        const match = userStory.match(regex);

        if (match) {
            return {
                role: match[1].trim(),
                feature: match[2].trim(),
                benefit: match[3].trim()
            };
        }
        return null;
    }

    generateAcceptanceCriteria(parsed) {
        return [{
            title: `Acceptance Test: ${parsed.role} can ${parsed.feature}`,
            description: `Verify that ${parsed.role} successfully completes: ${parsed.feature}`,
            category: 'acceptance',
            priority: 'Critical',
            type: 'UAT',
            steps: [
                `1. Login as ${parsed.role}`,
                `2. Navigate to ${parsed.feature} functionality`,
                `3. Execute required actions`,
                `4. Verify action completes`,
                `5. Confirm benefit: ${parsed.benefit}`
            ],
            expectedResult: `${parsed.role} should successfully ${parsed.feature}, achieving: ${parsed.benefit}`,
            format: 'acceptance_criteria'
        }];
    }

    generateGherkin(parsed) {
        return [{
            title: `BDD Scenario: ${parsed.feature}`,
            description: `Gherkin test for ${parsed.feature}`,
            category: 'bdd',
            priority: 'High',
            type: 'BDD',
            gherkin: `Feature: ${parsed.feature}
  As a ${parsed.role}
  I want to ${parsed.feature}
  So that ${parsed.benefit}

Scenario: Successfully ${parsed.feature}
  Given I am logged in as a ${parsed.role}
  When I attempt to ${parsed.feature}
  Then the action should complete successfully
  And I should achieve: ${parsed.benefit}

Scenario: ${parsed.feature} with invalid data
  Given I am logged in as a ${parsed.role}
  When I attempt to ${parsed.feature} with invalid input
  Then I should see an error message
  And the action should not complete`,
            format: 'gherkin'
        }];
    }

    // Code generation
    async generateFromCode(code, language = 'javascript') {
        const testCases = [];
        const functions = this.extractFunctions(code, language);

        functions.forEach(func => {
            testCases.push(...this.generateUnitTests(func));
            if (func.params.length > 0) {
                testCases.push(...this.generateParameterTests(func));
            }
        });

        return {
            testCases,
            confidence: this.calculateConfidence(code, testCases, {}),
            coverage: this.estimateCoverage(functions, testCases)
        };
    }

    extractFunctions(code, language) {
        const functions = [];

        if (language === 'javascript') {
            const funcRegex = /function\s+(\w+)\s*\(([^)]*)\)/g;
            let match;

            while ((match = funcRegex.exec(code)) !== null) {
                functions.push({
                    name: match[1],
                    params: match[2].split(',').map(p => p.trim()).filter(p => p),
                    language: 'javascript'
                });
            }

            const arrowRegex = /const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/g;
            while ((match = arrowRegex.exec(code)) !== null) {
                functions.push({
                    name: match[1],
                    params: match[2].split(',').map(p => p.trim()).filter(p => p),
                    language: 'javascript'
                });
            }
        }

        return functions;
    }

    generateUnitTests(func) {
        return [{
            title: `Unit Test: ${func.name}() - Valid Input`,
            description: `Verify ${func.name} returns correct output with valid parameters`,
            category: 'unit',
            priority: 'High',
            type: 'Unit',
            steps: [
                `1. Set up test data: ${func.params.join(', ')}`,
                `2. Call ${func.name}(${func.params.join(', ')})`,
                `3. Assert return value matches expected`,
                `4. Verify no exceptions thrown`
            ],
            expectedResult: `Function returns expected value without errors`,
            code: `test('${func.name} returns correct value', () => {\n  const result = ${func.name}(validData);\n  expect(result).toBeDefined();\n  expect(result).toEqual(expectedValue);\n});`
        }];
    }

    generateParameterTests(func) {
        return func.params.slice(0, 2).map(param => ({
            title: `Unit Test: ${func.name}() - Null ${param}`,
            description: `Test ${func.name} error handling for null ${param}`,
            category: 'unit',
            priority: 'Medium',
            type: 'Unit',
            steps: [
                `1. Call ${func.name}() with null ${param}`,
                `2. Verify appropriate error handling`,
                `3. Check error message`
            ],
            expectedResult: `Function should handle null ${param} gracefully`,
            code: `test('${func.name} handles null ${param}', () => {\n  expect(() => ${func.name}(null)).toThrowError();\n});`
        }));
    }

    estimateCoverage(functions, testCases) {
        if (functions.length === 0) return 0;

        const coveredFunctions = new Set();
        testCases.forEach(tc => {
            functions.forEach(func => {
                if (tc.title.includes(func.name)) {
                    coveredFunctions.add(func.name);
                }
            });
        });

        return Math.round((coveredFunctions.size / functions.length) * 100);
    }
}

module.exports = new AITestCaseGenerator();
