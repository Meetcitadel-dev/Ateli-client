
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyBH5hX563AVE0WIMynDWjKcxibtQlkzU94";
const genAI = new GoogleGenerativeAI(API_KEY);

const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.0-pro",
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash-lite-preview-09-2025"
];

async function findWorkingModel() {
    console.log("Testing models...");

    for (const modelName of candidates) {
        try {
            console.log(`Trying ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            console.log(`SUCCESS: ${modelName} responded: ${response.text().substring(0, 20)}...`);
            return;
        } catch (error) {
            console.log(`FAILED: ${modelName} - ${error.message.split(' ')[0]} ${error.status || ''}`);
        }
    }
}

findWorkingModel();
