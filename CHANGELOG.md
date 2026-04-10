# hybrid-rag-router Changelog

## [0.2.0] - 2026-04-10
### Added
- Store weighting for retrieval ranking (`weight?: number` on `RetrievalStore`)
- Route confidence scoring (0.4 - 1.0 based on intent match)
- Tracing hooks via `onTrace?: (event: TraceEvent) => void`
- Weighted result scoring in `getContext()` (`score * store.weight`)
- Route metadata embedded in chunk metadata
- 5 comprehensive tests covering routing, weighting, and tracing
- ESLint config and lint scripts

### Changed
- Demo now shows confidence, store weights, and trace events
- README with updated examples and feature list
- Improved TypeScript types for new features

### Tests
- `routes policy query to doc and vector stores`
- `routes structured query to sql store`
- `routes personal query to memory store`
- `applies store weight to ranking`
- `emits trace events`

## [0.1.4] - 2026-04-10
### Changed
- Cleanup: removed unused files from npm package
- Added `.npmignore` for lean distribution
- Simplified README
- Package size optimization

## [0.1.3] - 2026-04-10
### Fixed
- TypeScript compilation and build issues

## [0.1.2] - 2026-04-10
### Fixed
- Initial packaging issues

## [0.1.1] - 2026-04-10
### Fixed
- First working versions