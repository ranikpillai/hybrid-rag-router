export class HybridRouter {
    stores;
    maxResults;
    constructor(stores, options = {}) {
        this.stores = stores;
        this.maxResults = options.maxResults ?? 5;
    }
    async getContext(query) {
        const results = await Promise.all(this.stores.map(async (store) => {
            const chunks = await store.query(query);
            return chunks.map((chunk) => ({
                ...chunk,
                metadata: { ...(chunk.metadata ?? {}), storeName: store.name, storeType: store.type }
            }));
        }));
        return this.dedupeAndRank(results.flat()).slice(0, this.maxResults);
    }
    dedupeAndRank(chunks) {
        const seen = new Set();
        return chunks
            .filter((chunk) => {
            const key = `${chunk.source}::${chunk.text}`;
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        })
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
}
