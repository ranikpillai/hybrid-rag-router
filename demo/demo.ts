import { HybridRouter, type RetrievalStore } from '../src/index.js';

const vectorStore: RetrievalStore = {
  name: 'pinecone-like',
  type: 'vector',
  query: async (query) =>
    query.toLowerCase().includes('leave')
      ? [
          { text: 'Casual leave can be carried forward up to 5 days.', source: 'policy.pdf', score: 0.92 },
          { text: 'Medical leave requires manager approval after 2 days.', source: 'leave-rules.md', score: 0.71 }
        ]
      : []
};

const sqlStore: RetrievalStore = {
  name: 'postgres-like',
  type: 'sql',
  query: async (query) =>
    query.toLowerCase().includes('carry')
      ? [{ text: 'Carry forward max 5 days', source: 'hr_db', score: 0.88 }]
      : []
};

const docStore: RetrievalStore = {
  name: 'confluence-like',
  type: 'doc',
  query: async (query) =>
    query.toLowerCase().includes('leave')
      ? [{ text: 'Section 4.2: Casual leave carry forward limited to 5 days.', source: 'confluence', score: 0.95 }]
      : []
};

const router = new HybridRouter([vectorStore, sqlStore, docStore], { maxResults: 5 });
const context = await router.getContext('How many casual leaves can I carry forward?');

console.log(JSON.stringify(context, null, 2));
