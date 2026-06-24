const { getEmbedding } = require('../utils/embeddings');
const { index } = require('../utils/pinecone');

/**
 * Retrieves semantically relevant documents for a given patient from Pinecone.
 *
 * @param {string} patientId - MongoDB Patient ID to restrict query context
 * @param {string} query - The search query string
 * @param {number} topK - Number of top relevant documents to retrieve (default: 5)
 * @returns {Promise<{success: boolean, documents: Array, sourceTypes: Array}>}
 */
async function retrieveRelevantDocuments(patientId, query, topK = 5) {
    try {
        if (!patientId) {
            throw new Error('patientId is required for document retrieval.');
        }
        if (!query || typeof query !== 'string' || !query.trim()) {
            return {
                success: true,
                documents: [],
                sourceTypes: []
            };
        }

        // 1. Generate query embedding
        console.log(`[RetrievalService] Generating embedding for query: "${query}"`);
        const queryEmbedding = await getEmbedding(query);

        // 2. Query Pinecone with strict metadata filtering to prevent cross-patient leakage
        console.log(`[RetrievalService] Querying Pinecone for patientId: ${patientId}`);
        const queryResponse = await index.query({
            vector: queryEmbedding,
            topK: topK,
            filter: { patientId: { $eq: patientId.toString() } },
            includeMetadata: true
        });

        // 3. Process results
        const documents = [];
        const sourceTypes = new Set();

        if (queryResponse && queryResponse.matches) {
            for (const match of queryResponse.matches) {
                const metadata = match.metadata || {};
                const docType = metadata.type || 'unknown';
                sourceTypes.add(docType);

                documents.push({
                    id: match.id,
                    score: match.score || 0,
                    text: metadata.text || '',
                    type: docType,
                    contentId: metadata.contentId || null
                });
            }
        }

        console.log(`[RetrievalService] Retrieved ${documents.length} matches. Source types: ${Array.from(sourceTypes).join(', ')}`);

        return {
            success: true,
            documents,
            sourceTypes: Array.from(sourceTypes)
        };
    } catch (error) {
        console.error('[RetrievalService] Error retrieving relevant documents:', error.message);
        return {
            success: false,
            error: error.message,
            documents: [],
            sourceTypes: []
        };
    }
}

module.exports = {
    retrieveRelevantDocuments
};
