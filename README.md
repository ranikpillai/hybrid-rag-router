# hybrid-rag-router

Route RAG queries across multiple retrieval backends such as vector search, SQL, docs, and memory.

## Why

Most RAG systems need more than one retrieval method. This package gives a tiny, composable router that queries multiple stores and merges results.

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
  }
]);

const context = await router.getContext('What is the leave carry forward rule?');
console.log(context);
```

## Current scope

- Query multiple stores
- Merge and deduplicate chunks
- Score-based ranking
- TypeScript types included

## Next ideas

- Query classification before fan-out
- Store-specific weighting
- Optional reranking
- Tracing hooks
- Evaluation helpers
