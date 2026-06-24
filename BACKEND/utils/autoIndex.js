const pendingReindexes = new Map();

/**
 * Triggers a debounced reindex of patient records in Pinecone.
 * This prevents multiple closely spaced updates (e.g. chat creation or batch editing)
 * from making redundant calls to Gemini Embeddings and Pinecone APIs.
 * @param {string|ObjectId} patientId - MongoDB Patient ID
 */
function triggerReindex(patientId) {
    if (!patientId) return;
    const idStr = patientId.toString();

    // Clear existing timer if it exists
    if (pendingReindexes.has(idStr)) {
        clearTimeout(pendingReindexes.get(idStr));
    }

    // Schedule reindexing execution after 5 seconds of idle time
    const timer = setTimeout(async () => {
        pendingReindexes.delete(idStr);
        try {
            console.log(`[AutoIndex] Executing debounced reindex for patient: ${idStr}`);
            // Lazy load ragService to avoid circular dependency issues at boot time
            const { reindexPatient } = require('../services/ragService');
            const count = await reindexPatient(idStr);
            console.log(`[AutoIndex] Successfully reindexed patient ${idStr}. Vectors upserted: ${count}`);
        } catch (err) {
            console.error(`[AutoIndex] Debounced reindex failed for patient ${idStr}:`, err.message);
        }
    }, 5000);

    pendingReindexes.set(idStr, timer);
}

module.exports = { triggerReindex };
