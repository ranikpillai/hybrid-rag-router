# hybrid-rag-router

Intelligent hybrid RAG router for vector, SQL, document, and memory stores.

## What changed in 0.1.1

This version adds lightweight query intent classification and routes queries to the most relevant stores instead of always querying every store.

## Why

Most RAG systems need more than one retrieval method. Some questions are better answered from SQL, some from policy documents, and some from memory or semantic search.

## Install

```bash
npm install hybrid-rag-router
```

## Usage

```ts
import { HybridRouter } from 'hybrid-rag-router';

const router = new HybridRouter([
  {
    name: 'vector-main',
    type: 'vector',
    query: async (query) => [{ text: 'Example chunk', source: 'vector-store', score: 0.9 }]
  },
  {
    name: 'sql-main',
    type: 'sql',
    query: async (query) => [{ text: 'Structured row result', source: 'postgres', score: 0.8 }]
  },
  {
    name: 'doc-main',
    type: 'doc',
    query: async (query) => [{ text: 'Policy text', source: 'confluence', score: 0.85 }]
  }
]);

const route = router.route('What is the leave carry forward policy?');
console.log(route.intent);

const context = await router.getContext('What is the leave carry forward policy?');
console.log(context);
```

## Supported intents

- `structured` -> prefers SQL stores.
- `policy` -> prefers document and vector stores.
- `personal` -> prefers memory stores.
- `factual` -> prefers vector and document stores.
- `hybrid` -> falls back to all stores.

## Current scope

- Query intent classification
- Store routing
- Merge and deduplicate chunks
- Score-based ranking
- TypeScript types included

## Next ideas

- LLM-based routing
- Store-specific weighting
- Optional reranking
- Tracing hooks
- Evaluation helpers
