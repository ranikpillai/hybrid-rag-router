import assert from 'node:assert/strict';
import test from 'node:test';
import { HybridRouter } from '../src/index.js';
const stores = [
    { name: 'vector-main', type: 'vector', query: async () => [] },
    { name: 'sql-main', type: 'sql', query: async () => [] },
    { name: 'doc-main', type: 'doc', query: async () => [] },
    { name: 'memory-main', type: 'memory', query: async () => [] }
];
const router = new HybridRouter(stores);
test('routes policy query to doc and vector stores', () => {
    const route = router.route('What is the leave carry forward policy?');
    assert.equal(route.intent, 'policy');
    assert.deepEqual(route.selectedStores.map((store) => store.type), ['vector', 'doc']);
});
test('routes structured query to sql store', () => {
    const route = router.route('What is the total approved leaves this quarter?');
    assert.equal(route.intent, 'structured');
    assert.deepEqual(route.selectedStores.map((store) => store.type), ['sql']);
});
test('routes personal query to memory store', () => {
    const route = router.route('What did I ask last time?');
    assert.equal(route.intent, 'personal');
    assert.deepEqual(route.selectedStores.map((store) => store.type), ['memory']);
});
