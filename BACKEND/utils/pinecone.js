const { Pinecone } = require('@pinecone-database/pinecone');

const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX_NAME;

if (!apiKey) {
    console.warn('Warning: PINECONE_API_KEY is not defined in the environment.');
}

if (!indexName) {
    console.warn('Warning: PINECONE_INDEX_NAME is not defined in the environment.');
}

// Instantiate client
const pinecone = new Pinecone({
    apiKey: apiKey || 'dummy-key'
});

// Target the index
const index = pinecone.index(indexName || 'dummy-index');

/**
 * Test connectivity by describing index statistics
 */
async function testPineconeConnection() {
    try {
        if (!apiKey || !indexName) {
            throw new Error('Pinecone environment variables are missing.');
        }
        const stats = await index.describeIndexStats();
        return {
            success: true,
            message: 'Successfully connected to Pinecone.',
            stats
        };
    } catch (error) {
        console.error('Pinecone connection error:', error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

module.exports = {
    pinecone,
    index,
    testPineconeConnection
};
