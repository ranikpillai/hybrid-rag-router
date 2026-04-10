import { HybridRouter, type RetrievalStore } from '../src/index.js';

const vectorStore: RetrievalStore = {
  name: 'pinecone-like',
  type: 'vector',
  weight: 1.1,
  query: async (query) =>
    query.toLowerCase().includes('leave') || query.toLowerCase().includes('policy')
      ? [
          { text: 'Casual leave can be carried forward up to 5 days.', source: 'policy.pdf', score: 0.92 },
          { text: 'Medical leave requires manager approval after 2 days.', source: 'leave-rules.md', score: 0.71 }
        ]
      : []
};

const sqlStore: RetrievalStore = {
  name: 'postgres-like',
  type: 'sql',
  weight: 1.4,
  query: async (query) =>
    query.toLowerCase().includes('count') || query.toLowerCase().includes('total') || query.toLowerCase().includes('quarter')
      ? [{ text: 'Total approved leaves this quarter: 42', source: 'hr_db', score: 0.88 }]
      : []
};

const docStore: RetrievalStore = {
  name: 'confluence-like',
  type: 'doc',
  weight: 1.2,
  query: async (query) =>
    query.toLowerCase().includes('leave') || query.toLowerCase().includes('policy')
      ? [{ text: 'Section 4.2: Casual leave carry forward limited to 5 days.', source: 'confluence', score: 0.95 }]
      : []
};

const memoryStore: RetrievalStore = {
  name: 'memory-like',
  type: 'memory',
  weight: 1,
  query: async (query) =>
    query.toLowerCase().includes('my') || query.toLowerCase().includes('last time')
      ? [{ text: 'Your previous session asked about leave carry-forward and eligibility.', source: 'memory', score: 0.9 }]
      : []
};

const router = new HybridRouter([vectorStore, sqlStore, docStore, memoryStore], {
  maxResults: 5,
  onTrace: (event) => {
    console.log('TRACE:', JSON.stringify(event, null, 2));
  }
});

const queries = [
  'What is the leave carry forward policy?',
  'What is the total approved leaves this quarter?',
  'What did I ask last time about leave?'
];

for (const query of queries) {
  const route = router.route(query);
  const context = await router.getContext(query);
  console.log(`\nQUERY: ${query}`);
  console.log(`INTENT: ${route.intent}`);
  console.log(`CONFIDENCE: ${route.confidence}`);
  console.log(`STORES: ${route.selectedStores.map((store) => `${store.name}(w=${store.weight})`).join(', ')}`);
  console.log(JSON.stringify(context, null, 2));
}