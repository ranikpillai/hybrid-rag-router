# hybrid-rag-router

[![npm](https://img.shields.io/npm/dm/hybrid-rag-router)](https://npm-stat.com/~h24/hybrid-rag-router)
[![npm](https://img.shields.io/npm/v/hybrid-rag-router)](https://www.npmjs.com/package/hybrid-rag-router)

Intelligent hybrid RAG router for vector, SQL, document, and memory stores.

## What changed in 0.2.0

This version adds store weighting, route confidence scoring, and tracing hooks so developers can make routing decisions more transparent and tunable.

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
    weight: 1.1,
    query: async (query) => [{ text: 'Vector chunk', source: 'vector-store', score: 0.9 }]
  },
  {
    name: 'sql-main',
    type: 'sql',
    weight: 1.4,
    query: async (query) => [{ text: 'Structured row result', source: 'postgres', score: 0.8 }]
  }
], {
  onTrace: (event) => console.log(event)
});

const route = router.route('What is the total approved leaves this quarter?');
console.log(route.intent, route.confidence);

const context = await router.getContext('What is the total approved leaves this quarter?');
console.log(context);
```

## Features

- Query intent classification
- Store routing by type
- Store weighting for ranking
- Route confidence scoring
- Trace hooks for debugging
- Merge and deduplicate chunks
- TypeScript types included

## Supported intents

- `structured` -> prefers SQL stores.
- `policy` -> prefers document and vector stores.
- `personal` -> prefers memory stores.
- `factual` -> prefers vector and document stores.
- `hybrid` -> falls back to all stores.

## Next ideas

- LLM-based routing
- Reranking plugins
- Evaluation helpers
- Routing analytics
