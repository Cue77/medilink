import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDHiwrtjxtjpDpgwW2dqloAsJQnAysQgdI"; // Hardcoded for this test script only
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModelsRest() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            const chatModels = data.models
                .filter(m => m.supportedGenerationMethods.includes("generateContent"))
                .map(m => m.name);
            console.log("Chat Models:", JSON.stringify(chatModels, null, 2));
        } else {
            console.log("No models found or error:", data);
        }
    } catch (error) {
        console.error("REST API Error:", error.message);
    }
}

listModelsRest();
