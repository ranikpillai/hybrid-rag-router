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

export class HybridRouter {
  private stores: RetrievalStore[];
  private maxResults: number;

  constructor(stores: RetrievalStore[], options: HybridRouterOptions = {}) {
    this.stores = stores;
    this.maxResults = options.maxResults ?? 5;
  }

  async getContext(query: string): Promise<ContextChunk[]> {
    const results = await Promise.all(
      this.stores.map(async (store) => {
        const chunks = await store.query(query);
        return chunks.map((chunk) => ({
          ...chunk,
          metadata: { ...(chunk.metadata ?? {}), storeName: store.name, storeType: store.type }
        }));
      })
    );

    return this.dedupeAndRank(results.flat()).slice(0, this.maxResults);
  }

  private dedupeAndRank(chunks: ContextChunk[]): ContextChunk[] {
    const seen = new Set<string>();
    return chunks
      .filter((chunk) => {
        const key = `${chunk.source}::${chunk.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
}
