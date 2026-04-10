const DEFAULT_RULES = {
    structured: ['count', 'sum', 'average', 'total', 'sql', 'table', 'report', 'number', 'metric', 'how many', 'quarter', 'approved'],
    policy: ['policy', 'rule', 'guideline', 'leave', 'eligibility', 'approval', 'manual', 'sop'],
    personal: ['my', 'me', 'mine', 'history', 'previous', 'last time', 'session'],
    factual: ['what', 'who', 'when', 'where', 'define', 'explain'],
    hybrid: []
};
export class HybridRouter {
    stores;
    maxResults;
    rules;
    constructor(stores, options = {}) {
        this.stores = stores;
        this.maxResults = options.maxResults ?? 5;
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
    classify(query) {
        const lower = query.toLowerCase();
        const signalCount = (keywords) => keywords.reduce((sum, keyword) => sum + (lower.includes(keyword) ? 1 : 0), 0);
        const structuredScore = signalCount(this.rules.structured) * 2;
        const policyScore = signalCount(this.rules.policy);
        const personalScore = signalCount(this.rules.personal);
        const factualScore = signalCount(this.rules.factual);
        if (structuredScore >= 2)
            return 'structured';
        if (personalScore >= 1)
            return 'personal';
        if (policyScore >= 1 && structuredScore === 0)
            return 'policy';
        if (factualScore >= 1 && policyScore === 0 && structuredScore === 0)
            return 'factual';
        const scores = {
            factual: factualScore,
            structured: structuredScore,
            policy: policyScore,
            personal: personalScore,
            hybrid: 0
        };
        const sorted = Object.entries(scores)
            .filter(([intent]) => intent !== 'hybrid')
            .sort((a, b) => b[1] - a[1]);
        if (sorted[0][1] === 0)
            return 'hybrid';
        if (sorted[0][1] === sorted[1][1])
            return 'hybrid';
        return sorted[0][0];
    }
    route(query) {
        const intent = this.classify(query);
        const reasons = [];
        let selectedStores = this.stores;
        if (intent === 'structured') {
            selectedStores = this.stores.filter((store) => store.type === 'sql');
            reasons.push('Detected structured or numeric query, preferring SQL stores.');
        }
        else if (intent === 'policy') {
            selectedStores = this.stores.filter((store) => store.type === 'doc' || store.type === 'vector');
            reasons.push('Detected policy or manual style query, preferring doc and vector stores.');
        }
        else if (intent === 'personal') {
            selectedStores = this.stores.filter((store) => store.type === 'memory');
            reasons.push('Detected personal or session query, preferring memory stores.');
        }
        else if (intent === 'factual') {
            selectedStores = this.stores.filter((store) => store.type === 'vector' || store.type === 'doc');
            reasons.push('Detected factual query, preferring vector and doc stores.');
        }
        else {
            reasons.push('No clear intent match, using hybrid retrieval across all stores.');
        }
        if (selectedStores.length === 0) {
            selectedStores = this.stores;
            reasons.push('No matching stores found for intent, falling back to all stores.');
        }
        return { intent, selectedStores, reasons };
    }
    async getContext(query) {
        const route = this.route(query);
        const results = await Promise.all(route.selectedStores.map(async (store) => {
            const chunks = await store.query(query);
            return chunks.map((chunk) => ({
                ...chunk,
                metadata: {
                    ...(chunk.metadata ?? {}),
                    storeName: store.name,
                    storeType: store.type,
                    intent: route.intent,
                    routeReasons: route.reasons
                }
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
