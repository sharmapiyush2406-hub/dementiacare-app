const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn('Warning: GEMINI_API_KEY is not defined in the environment.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

/**
 * Generate vector embedding (768 dimensions) using Gemini embedding model
 * @param {string} text - The input text content to embed
 * @returns {Promise<Array<number>>} The vector embedding array
 */
async function getEmbedding(text) {
    try {
        if (!text || typeof text !== 'string' || !text.trim()) {
            throw new Error('Input text must be a non-empty string.');
        }

        const result = await model.embedContent({
            content: { parts: [{ text: text.trim() }] },
            outputDimensionality: 768
        });
        
        if (result && result.embedding && result.embedding.values) {
            return result.embedding.values;
        } else {
            throw new Error('Invalid response payload from Gemini embedding API.');
        }
    } catch (error) {
        console.error('Gemini Embedding API Error:', error.message);
        throw error;
    }
}

module.exports = {
    getEmbedding
};
