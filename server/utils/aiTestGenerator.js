const { GoogleGenerativeAI } = require('@google/generative-ai');

class AITestCaseGenerator {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
    }

    async generateFromRequirement(requirement) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
            You are an expert QA Automation Engineer. I will provide you with a requirement.
            Please generate comprehensive positive, negative, and edge test cases for it.
            Return the output strictly as a JSON array of objects with the following format:
            [
              {
                "title": "Test case title",
                "description": "Test description",
                "category": "positive|negative|edge_case|boundary",
                "priority": "Critical|High|Medium|Low",
                "type": "Functional|Security|UI|Performance",
                "steps": ["1. Step one", "2. Step two"],
                "expectedResult": "Expected outcome"
              }
            ]
            
            Requirement:
            ${requirement}
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Extract JSON from markdown if present
            let jsonStr = text;
            if (text.includes('```json')) {
                jsonStr = text.split('```json')[1].split('```')[0].trim();
            } else if (text.includes('```')) {
                jsonStr = text.split('```')[1].split('```')[0].trim();
            }

            const testCases = JSON.parse(jsonStr);

            return {
                testCases,
                confidence: 0.95,
                summary: {
                    total: testCases.length,
                    positive: testCases.filter(t => t.category === 'positive').length,
                    negative: testCases.filter(t => t.category === 'negative').length,
                    boundary: testCases.filter(t => t.category === 'boundary').length,
                    edge: testCases.filter(t => t.category === 'edge_case').length
                }
            };
        } catch (error) {
            console.error("Gemini API Error:", error);
            // Fallback empty response
            return { testCases: [], confidence: 0, summary: { total: 0 } };
        }
    }

    async generateFromUserStory(userStory) {
        return this.generateFromRequirement(userStory);
    }

    async generateFromCode(code, language = 'javascript') {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
            You are an expert SDET. I will provide you with source code in ${language}.
            Please generate comprehensive unit test cases and boundary test cases for it.
            Return the output strictly as a JSON array of objects with the following format:
            [
              {
                "title": "Test case title",
                "description": "Test description",
                "category": "unit|boundary|negative",
                "priority": "Critical|High|Medium|Low",
                "type": "Unit",
                "steps": ["1. Set up data", "2. Call function"],
                "expectedResult": "Expected outcome",
                "code": "// Jest or appropriate test code snippet"
              }
            ]
            
            Code:
            ${code}
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            let jsonStr = text;
            if (text.includes('```json')) {
                jsonStr = text.split('```json')[1].split('```')[0].trim();
            } else if (text.includes('```')) {
                jsonStr = text.split('```')[1].split('```')[0].trim();
            }

            const testCases = JSON.parse(jsonStr);

            return {
                testCases,
                confidence: 0.95,
                coverage: 80
            };
        } catch (error) {
            console.error("Gemini API Error:", error);
            return { testCases: [], confidence: 0, coverage: 0 };
        }
    }
}

module.exports = new AITestCaseGenerator();
