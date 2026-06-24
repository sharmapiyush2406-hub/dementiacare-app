const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
});

async function askGemini(message) {
    try {
        const result = await model.generateContent(message);

        return result.response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        throw error;
    }
}

module.exports = askGemini;