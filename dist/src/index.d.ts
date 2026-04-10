export type StoreType = 'vector' | 'sql' | 'doc' | 'memory';
export interface ContextChunk {
    text: string;
    source: string;
    score?: number;
    metadata?: Record<string, unknown>;
}
export interface RetrievalStore {
    name: string;
    type: StoreType;
    query: (query: string) => Promise<ContextChunk[]>;
}
export interface HybridRouterOptions {
    maxResults?: number;
}
export declare class HybridRouter {
    private stores;
    private maxResults;
    constructor(stores: RetrievalStore[], options?: HybridRouterOptions);
    getContext(query: string): Promise<ContextChunk[]>;
    private dedupeAndRank;
}
