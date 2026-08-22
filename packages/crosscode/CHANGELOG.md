# crosscode

## 0.6.1

### Patch Changes

- Fix CLI proxy stripping query strings from requests proxied to opencode

  `sanitizeUrlPath` removed everything after `?`, so requests like `GET /file?path=.` arrived at opencode without their params and failed with 400 "Missing key path" schema rejections. This also silently broke message pagination (`?limit=&offset=`) and file search. Query strings are now preserved while path sanitization (traversal and `@` checks) is retained.

## 0.6.0

### Minor Changes

- b6750ef: feat(cli): add git-log and git-commit endpoints for mobile git graph

## 0.5.0

### Minor Changes

- feat: git graph

## 0.4.1

### Patch Changes

- e592f25: fix(crosscode): add shutdown source logging

## 0.4.0

### Minor Changes

- e528a93: Add configurable tunnel WS URL via config.json

## 0.3.8

### Patch Changes

- be6374a: fix: pass --port to opencode serve to ensure correct port binding

## 0.3.7

### Patch Changes

- 2edfb99: Add direct test to opencode and 401 response logging

## 0.3.6

### Patch Changes

- cf9d379: Add detailed header forwarding logs for debugging

## 0.3.5

### Patch Changes

- 2ee5f00: chore: add session token logging to debug auth mismatch

## 0.3.4

### Patch Changes

- efd7fbf: chore: add enhanced logging to debug Authorization header flow

## 0.3.3

### Patch Changes

- 5272927: fix: convert Authorization header to Basic Auth format for opencode

## 0.3.2

### Patch Changes

- ab4d4b9: chore: add debug logging to trace Authorization header flow

## 0.3.1

### Patch Changes

- 5ddbc37: ---

## 0.3.0

### Minor Changes

- aaf4e04: add: help menu

## 0.2.0

### Minor Changes

- 02e7aed: custom tunnel fixes

### Patch Changes

- fix opencode spawning

## 0.2.0-beta.1

### Minor Changes

- custom tunnel fixes

## 1.0.0

### Major Changes

- Added comprehensive CLI documentation with all flags, login flow, tunnel providers, config reference, and created docs/cli.md
