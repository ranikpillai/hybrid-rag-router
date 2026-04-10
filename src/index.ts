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

const DEFAULT_RULES: Record<QueryIntent, string[]> = {
  structured: ['count', 'sum', 'average', 'total', 'sql', 'table', 'report', 'number', 'metric', 'how many', 'quarter', 'approved'],
  policy: ['policy', 'rule', 'guideline', 'leave', 'eligibility', 'approval', 'manual', 'sop'],
  personal: ['my', 'me', 'mine', 'history', 'previous', 'last time', 'session'],
  factual: ['what', 'who', 'when', 'where', 'define', 'explain'],
  hybrid: []
};

export class HybridRouter {
  private stores: RetrievalStore[];
  private maxResults: number;
  private rules: Record<QueryIntent, string[]>;
  private onTrace?: (event: TraceEvent) => void;

  constructor(stores: RetrievalStore[], options: HybridRouterOptions = {}) {
    this.stores = stores.map((store) => ({ ...store, weight: store.weight ?? 1 }));
    this.maxResults = options.maxResults ?? 5;
    this.onTrace = options.onTrace;
    this.rules = {
      ...DEFAULT_RULES,
      ...options.intentRules,
      structured: options.intentRules?.structured ?? DEFAULT_RULES.structured,
      policy: options.intentRules?.policy ?? DEFAULT_RULES.policy,
      personal: options.intentRules?.personal ?? DEFAULT_RULES.personal,
      factual: options.intentRules?.factual ?? DEFAULT_RULES.factual,
      hybrid: []
    };
  }

  classify(query: string): QueryIntent {
    const lower = query.toLowerCase();

    const signalCount = (keywords: string[]) =>
      keywords.reduce((sum, keyword) => sum + (lower.includes(keyword) ? 1 : 0), 0);

    const structuredScore = signalCount(this.rules.structured) * 2;
    const policyScore = signalCount(this.rules.policy);
    const personalScore = signalCount(this.rules.personal);
    const factualScore = signalCount(this.rules.factual);

    if (structuredScore >= 2) return 'structured';
    if (personalScore >= 1) return 'personal';
    if (policyScore >= 1 && structuredScore === 0) return 'policy';
    if (factualScore >= 1 && policyScore === 0 && structuredScore === 0) return 'factual';

    const scores: Record<QueryIntent, number> = {
      factual: factualScore,
      structured: structuredScore,
      policy: policyScore,
      personal: personalScore,
      hybrid: 0
    };

    const sorted = Object.entries(scores)
      .filter(([intent]) => intent !== 'hybrid')
      .sort((a, b) => b[1] - a[1]);

    if (sorted[0][1] === 0) return 'hybrid';
    if (sorted[0][1] === sorted[1][1]) return 'hybrid';
    return sorted[0][0] as QueryIntent;
  }

  route(query: string): QueryRouteResult {
    const intent = this.classify(query);
    const reasons: string[] = [];

    let selectedStores = this.stores;
    let confidence = 0.45;

    if (intent === 'structured') {
      selectedStores = this.stores.filter((store) => store.type === 'sql');
      reasons.push('Detected structured or numeric query, preferring SQL stores.');
      confidence = 0.92;
    } else if (intent === 'policy') {
      selectedStores = this.stores.filter((store) => store.type === 'doc' || store.type === 'vector');
      reasons.push('Detected policy or manual style query, preferring doc and vector stores.');
      confidence = 0.86;
    } else if (intent === 'personal') {
      selectedStores = this.stores.filter((store) => store.type === 'memory');
      reasons.push('Detected personal or session query, preferring memory stores.');
      confidence = 0.9;
    } else if (intent === 'factual') {
      selectedStores = this.stores.filter((store) => store.type === 'vector' || store.type === 'doc');
      reasons.push('Detected factual query, preferring vector and doc stores.');
      confidence = 0.75;
    } else {
      reasons.push('No clear intent match, using hybrid retrieval across all stores.');
    }

    if (selectedStores.length === 0) {
      selectedStores = this.stores;
      reasons.push('No matching stores found for intent, falling back to all stores.');
      confidence = Math.min(confidence, 0.4);
    }

    const route = { intent, selectedStores, reasons, confidence };

    this.onTrace?.({
      query,
      intent,
      confidence,
      selectedStoreNames: selectedStores.map((store) => store.name),
      reasons
    });

    return route;
  }

  async getContext(query: string): Promise<ContextChunk[]> {
    const route = this.route(query);
    const results = await Promise.all(
      route.selectedStores.map(async (store) => {
        const chunks = await store.query(query);
        return chunks.map((chunk) => ({
          ...chunk,
          score: (chunk.score ?? 0) * (store.weight ?? 1),
          metadata: {
            ...(chunk.metadata ?? {}),
            storeName: store.name,
            storeType: store.type,
            storeWeight: store.weight,
            intent: route.intent,
            routeConfidence: route.confidence,
            routeReasons: route.reasons
          }
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
