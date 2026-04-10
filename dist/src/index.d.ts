export type StoreType = 'vector' | 'sql' | 'doc' | 'memory';
export type QueryIntent = 'factual' | 'structured' | 'policy' | 'personal' | 'hybrid';
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
    weight?: number;
}
export interface QueryRouteResult {
    intent: QueryIntent;
    selectedStores: RetrievalStore[];
    reasons: string[];
    confidence: number;
}
export interface TraceEvent {
    query: string;
    intent: QueryIntent;
    confidence: number;
    selectedStoreNames: string[];
    reasons: string[];
}
export interface HybridRouterOptions {
    maxResults?: number;
    intentRules?: Partial<Record<QueryIntent, string[]>>;
    onTrace?: (event: TraceEvent) => void;
}
export declare class HybridRouter {
    private stores;
    private maxResults;
    private rules;
    private onTrace?;
    constructor(stores: RetrievalStore[], options?: HybridRouterOptions);
    classify(query: string): QueryIntent;
    route(query: string): QueryRouteResult;
    getContext(query: string): Promise<ContextChunk[]>;
    private dedupeAndRank;
}
