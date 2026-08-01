# CrossCode Mobile - Performance & Code Quality Audit

> Generated: Sat Aug 01 2026
> Scope: Full scan of `apps/mobile` - all screens, components, stores, lib files, hooks, and config

---

## Completed Optimizations (Already Applied)

### Round 1 - SSE & Streaming
| Fix | File | Impact |
|-----|------|--------|
| rAF batching for SSE updates | `components/hooks/event-stream.ts` | Reduced store updates from ~30/sec to ~1/sec during streaming |
| Removed persist middleware from messages store | `store/messages.store.ts` | Eliminated AsyncStorage serialization on every token |
| Memoized `[...messages].reverse()` | `app/project/.../index.tsx` | Prevented new array reference every render |
| Question poll dedup + 5s interval | `app/project/.../index.tsx` | Only updates store if questions actually changed |
| Replaced LayoutAnimation with Reanimated | `bash-block.tsx`, `edit-block.tsx`, `tool-block.tsx`, `reasoning-block.tsx` | Removed global animation jank |

### Round 2 - Comprehensive
| Fix | File | Impact |
|-----|------|--------|
| Removed 30s health check interval | `app/(tabs)/index.tsx` | Home page no longer polls in background |
| Stabilized fetchSessions dependencies | `app/sessions.tsx` | Prevents unnecessary re-fetches |
| Scroll effect uses `messages.length` | `app/project/.../index.tsx` | No scroll effect on every token |
| Memoized onScrollBeginDrag | `app/project/.../index.tsx` | No inline function creation |
| pendingQuestions only to question items | `app/project/.../index.tsx` | MessageItems skip re-renders every 5s |
| Zustand skip no-op updates | `connection.store.ts`, `projects.store.ts`, `models.store.ts` | Returns same state reference when unchanged |
| Fetch error handling | `projects.ts`, `sessions.ts`, `recents.ts`, `models.ts` | Proper `res.ok` checks |
| Virtualized diff page | `diff.tsx` | FlatList instead of rendering all lines |
| Fixed useEffect deps | `connect.tsx` | Added missing dependencies |

---

## Critical Flaws (Crashes, Data Loss, Broken UX)

### 1. Memory Leak: Share Session Modal setTimeout
- **File**: `components/share-session-modal.tsx:25`
- **Severity**: CRITICAL
- **Problem**: `setTimeout(() => setCopied(false), 2000)` is never cleared on unmount. If the modal closes before 2 seconds, React updates state on an unmounted component.
- **Fix**: Store the timeout ref and clear it in a cleanup function or on modal close.

```tsx
const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

const handleCopy = async () => {
    if (!shareUrl) return
    try {
        await Share.share({ message: shareUrl })
        setCopied(true)
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
        copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {}
}

const handleClose = () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    setCopied(false)
    onClose()
}
```

### 2. Memory Leak: QR Scanner Cooldown Timer
- **File**: `components/qr-scanner.tsx:37`
- **Severity**: CRITICAL
- **Problem**: `cooldownTimer.current = setTimeout(...)` is never cleared on unmount.
- **Fix**: Add useEffect cleanup.

```tsx
useEffect(() => {
    return () => {
        if (cooldownTimer.current) clearTimeout(cooldownTimer.current)
    }
}, [])
```

### 3. TodoBlock Still Uses LayoutAnimation
- **File**: `components/todo-block.tsx:28`
- **Severity**: CRITICAL
- **Problem**: Was missed in the LayoutAnimation -> Reanimated migration. Still uses the global `LayoutAnimation.configureNext()` which causes frame drops.
- **Fix**: Replace with Reanimated `useSharedValue` + `withTiming`, same pattern as other blocks.

### 4. Question Block Submitting State Never Resets
- **File**: `components/question-block.tsx:164-184`
- **Severity**: CRITICAL
- **Problem**: Both `handleSubmit` (line 166) and `handleReject` (line 182) set `submitting = true` but never reset it to `false`. If the request fails or the question is removed, the UI is permanently stuck showing "Sending..." with all buttons disabled.
- **Fix**: Reset `submitting` after the reply/reject call completes, or when the question is removed from the list.

```tsx
const handleSubmit = useCallback(async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    const answers = selections.map((sel, i) => {
        const hasCustom = request.questions[i].custom ?? false
        const customText = (customTexts[i] ?? "").trim()
        if (hasCustom && customText) return [...sel, customText]
        return sel
    })
    await onReply(request.id, answers)
    setSubmitting(false)
}, [canSubmit, submitting, selections, customTexts, request, onReply])
```

### 5. Event Stream Cleanup Loses Pending Messages
- **File**: `components/hooks/event-stream.ts:320-326`
- **Severity**: CRITICAL
- **Problem**: When the component unmounts, `abort.abort()` is called but any `pendingMessages` buffered via `getOrCreatePending()` are never flushed to the store. All streaming updates in the current animation frame are lost.
- **Fix**: Flush pending messages before aborting.

```tsx
return () => {
    if (pendingMessages !== null) {
        useMessages.getState().setMessages(sid, pendingMessages)
    }
    abort.abort()
    abortRef.current = null
    setConnectionStatus("disconnected")
    setStreaming(sid, false)
    setActiveMessageId(sid, null)
}
```

### 6. Event Stream Reconnect Timer Leak
- **File**: `components/hooks/event-stream.ts:221`
- **Severity**: CRITICAL
- **Problem**: `setTimeout(() => connect(), delay)` in `scheduleReconnect()` is never stored in a ref. On cleanup, the timeout fires and attempts to reconnect on an aborted stream, causing unhandled errors.
- **Fix**: Store the reconnect timeout in a ref and clear it on cleanup.

```tsx
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

function scheduleReconnect() {
    // ... existing code ...
    reconnectTimer = setTimeout(() => {
        if (!abort.signal.aborted) connect()
    }, delay)
}

return () => {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (pendingMessages !== null) {
        useMessages.getState().setMessages(sid, pendingMessages)
    }
    abort.abort()
    // ...
}
```

### 7. formatTime Uses Stale Date.now()
- **File**: `app/sessions.tsx:21-33`
- **Severity**: CRITICAL
- **Problem**: `formatTime(ts)` computes `Date.now()` at call time, but the result is rendered inside list items that don't re-render. After the app runs for a while, "5m ago" still shows "5m ago" even when it should be "6m ago". Times become increasingly inaccurate.
- **Fix**: Use a state-based tick that updates periodically, or accept this as acceptable staleness. Alternatively, move to a relative time component that re-renders on an interval.

### 8. Missing res.ok Check in getSessionsByProjectDir
- **File**: `lib/sessions.ts:22-36`
- **Severity**: CRITICAL
- **Problem**: After the previous fix attempt, the function still doesn't check `res.ok` before calling `res.json()`. A 500 error will try to parse the error body as sessions.
- **Fix**: Add `if (!res.ok) return` before `res.json()`.

### 9. Missing res.ok Check in getCurrentProject
- **File**: `lib/projects.ts:9-12`
- **Severity**: CRITICAL
- **Problem**: `Promise.all` resolves even on HTTP errors. The `.json()` calls proceed without checking status codes.
- **Fix**: Check `res.ok` for both responses before parsing.

### 10. Missing res.ok Check in getRecents
- **File**: `lib/recents.ts:5-10`
- **Severity**: CRITICAL
- **Problem**: Same as above - no HTTP status check before parsing JSON.
- **Fix**: Add `if (!res.ok) return` before `res.json()`.

### 11. No Splash Screen Timeout
- **File**: `app/_layout.tsx:23-27`
- **Severity**: CRITICAL
- **Problem**: If fonts fail to load (network issue, corrupted font file), `fontsLoaded` stays `false` forever and the app shows a white screen with no fallback.
- **Fix**: Add a timeout that hides the splash screen after a maximum wait.

```tsx
React.useEffect(() => {
    if (fontsLoaded) {
        SplashScreen.hideAsync()
    } else {
        const timeout = setTimeout(() => SplashScreen.hideAsync(), 5000)
        return () => clearTimeout(timeout)
    }
}, [fontsLoaded])
```

---

## High Severity Flaws (Performance Issues, Incorrect Behavior)

### 12. Scroll Effect Fires During Streaming
- **File**: `app/project/.../index.tsx:581-587`
- **Severity**: HIGH
- **Problem**: `useEffect` depends on `messages.length`. During streaming, every new message (not just token) triggers `scrollToOffset`. This is mostly correct but fires on every message addition including pagination loads.
- **Fix**: Consider tracking whether the change came from streaming vs pagination.

### 13. RETRY_DELAYS and MESSAGES_PER_PAGE Inside Component
- **File**: `app/project/.../index.tsx:227,82`
- **Severity**: HIGH
- **Problem**: `RETRY_DELAYS = [10, 30, 120, 300, 600]` and `MESSAGES_PER_PAGE = 20` are defined inside the component function body. They're recreated on every render (though JS engines optimize constant arrays, it's still bad practice).
- **Fix**: Move to module scope.

### 14. formatRetryTime Not Memoized
- **File**: `app/project/.../index.tsx:229-234`
- **Severity**: HIGH
- **Problem**: `formatRetryTime` is defined inside the component and recreated every render. It's used in JSX so it's called on every render.
- **Fix**: Move to module scope (it's a pure function with no dependencies).

### 15. Connection Lookup Not Memoized in Models Page
- **File**: `app/models.tsx:47`
- **Severity**: HIGH
- **Problem**: `connections.find((c) => c.id === current)` runs on every render. Should be memoized.
- **Fix**: Wrap in `useMemo(() => connections.find(...) ?? null, [connections, current])`.

### 16. useEffect Missing fetchAll Dependency
- **File**: `app/models.tsx:62-64`
- **Severity**: HIGH
- **Problem**: `useEffect(() => { if (connection) fetchAll(...) }, [connection?.id])` - `fetchAll` is missing from deps. If the store reinitializes, the effect won't re-run.
- **Fix**: Either add `fetchAll` to deps (it's stable from zustand) or use `useModels.getState().fetchAll` inside the effect.

### 17. isSelected Defined Inside Component
- **File**: `app/project/.../models.tsx:144-145`
- **Severity**: HIGH
- **Problem**: `const isSelected = (modelId, providerId) => ...` is recreated every render and used inside `renderItem` callback.
- **Fix**: Move outside component or inline the comparison.

### 18. handleSelect Has updating in Dependency Array
- **File**: `app/project/.../models.tsx:117-142`
- **Severity**: HIGH
- **Problem**: `handleSelect` depends on `updating` which changes every time a model is being selected. This creates a new callback on every selection, invalidating `renderItem` memoization.
- **Fix**: Use a ref for `updating` instead of state, or use `useRef` to track the current updating value.

### 19. Diff Page keyExtractor Uses Index
- **File**: `app/project/.../diff.tsx:100`
- **Severity**: HIGH
- **Problem**: `keyExtractor` uses `index` which is not stable. If diff lines change (e.g., on refresh), React may reuse wrong items.
- **Fix**: Generate a stable key from line type + content hash or line number.

### 20. Diff Page renderLine Dependencies Recalculated
- **File**: `app/project/.../diff.tsx:33-48`
- **Severity**: HIGH
- **Problem**: Color constants (`addBg`, `delBg`, etc.) are computed inside the component body and passed as dependencies to `useCallback` for `renderLine`. They're recomputed every render.
- **Fix**: Move color computation inside the callback or memoize the color values.

### 21. Health Check Runs Sequentially
- **File**: `app/(tabs)/index.tsx:192-213`
- **Severity**: HIGH
- **Problem**: `checkHealth` loops through connections with `for...of` and `await` inside. Each health check waits for the previous one to complete.
- **Fix**: Use `Promise.all` to check all connections in parallel.

```tsx
const checkHealth = useCallback(async () => {
    await Promise.all(connections.map(async (conn) => {
        if (!conn.url || !conn.token) return
        try {
            const res = await fetch(`${conn.url}/global/health`, { ... })
            setConnectionHealth(conn.id, res.ok)
        } catch {
            setConnectionHealth(conn.id, false)
        }
    }))
}, [connections, setConnectionHealth])
```

### 22. checkHealth Has connections Array in Deps
- **File**: `app/(tabs)/index.tsx:192`
- **Severity**: HIGH
- **Problem**: `connections` is a new array reference every time any connection changes (from zustand). This causes `checkHealth` to be recreated and `useFocusEffect` to re-run on every connection update.
- **Fix**: Use `connections.length` or a stable hash in the dependency array.

### 23. testConnection Not Wrapped in useCallback
- **File**: `app/connect.tsx:26-55`
- **Severity**: HIGH
- **Problem**: `testConnection` is a regular async function that references `url` and `token` from params. It's called in `useEffect` with `[]` deps (now fixed to `[url, token]`), but the function itself is recreated every render.
- **Fix**: Wrap in `useCallback` with `[url, token]` deps.

### 24. MemoPartRenderer pendingQuestions Comparison
- **File**: `components/message-item.tsx:277`
- **Severity**: HIGH
- **Problem**: `prev.pendingQuestions === next.pendingQuestions` uses reference equality. Since the session screen creates `pendingQuestions` from zustand (which returns the same reference when unchanged), this works correctly. BUT if the parent ever passes a new array (e.g., `EMPTY_QUESTIONS`), all parts re-render. The optimization in session screen (passing `EMPTY_QUESTIONS` for non-question items) mitigates this.
- **Fix**: Already partially fixed. Could add deep comparison for question arrays if needed.

### 25. pickImages Has images in Deps (Stale Closure)
- **File**: `components/chat-input.tsx:150-172`
- **Severity**: HIGH
- **Problem**: `pickImages` depends on `images` array. If the user opens the picker, the callback captures the current images. If images change while picker is open, the result uses stale data.
- **Fix**: Use a ref for images or use functional state update.

### 26. removeImage Has images in Deps (Stale Closure)
- **File**: `components/chat-input.tsx:174-176`
- **Severity**: HIGH
- **Problem**: Same stale closure issue as pickImages.
- **Fix**: Use functional state update: `onImagesChange(prev => prev.filter((_, i) => i !== index))`.

### 27. TypingDots Uses Old Animated API
- **File**: `components/typing-animation.tsx`
- **Severity**: HIGH
- **Problem**: Uses `Animated.Value` from React Native instead of `react-native-reanimated`. Inconsistent with the rest of the app and runs on JS thread instead of UI thread.
- **Fix**: Migrate to `useSharedValue` + `useAnimatedStyle` from Reanimated.

### 28. Chat Store partialize Drops Drafts
- **File**: `store/chat.store.ts:123-125`
- **Severity**: HIGH
- **Problem**: `partialize: (state) => ({ modelByAgent: state.modelByAgent })` only persists `modelByAgent`. All drafts in `draftBySession` are lost on app restart. Users lose typed messages if they close the app.
- **Fix**: Add `draftBySession` to partialize, or accept this as intentional (drafts are ephemeral).

### 29. Messages Store Removed Persistence Without Migration
- **File**: `store/messages.store.ts`
- **Severity**: HIGH
- **Problem**: Previous optimization removed `persist` middleware. Existing users who had messages cached in AsyncStorage will lose them on update. The messages are re-fetched from server, but there's a flash of empty state.
- **Fix**: Acceptable trade-off. Could add a one-time migration that clears the old AsyncStorage key.

### 30. upsertSessions Always Creates New Array
- **File**: `store/sessions.store.ts:73-83`
- **Severity**: HIGH
- **Problem**: `upsertSessions` always returns a new array via `Array.from(byId.values())` even if nothing changed. This triggers re-renders in all components that subscribe to sessions.
- **Fix**: Check if any session actually changed before returning new state.

### 31. getUnreadCount Filters on Every Call
- **File**: `store/notifications.store.ts:64`
- **Severity**: HIGH
- **Problem**: `getUnreadCount: () => get().notifications.filter((n) => !n.read).length` iterates all notifications every time it's called. If called in a render, it causes unnecessary computation.
- **Fix**: Maintain a `unreadCount` field that's updated incrementally.

---

## Medium Severity Flaws (Code Quality, Maintainability)

### 32. Dead Code: Connections Tab Screen
- **File**: `app/(tabs)/connections.tsx`
- **Severity**: MEDIUM
- **Problem**: This screen exists but appears to have no navigation to it. It's a read-only list with no interaction.
- **Fix**: Either wire it up or remove it.

### 33. Placeholder: Debug Logs Screen
- **File**: `app/debug-logs.tsx`
- **Severity**: MEDIUM
- **Problem**: Shows "No logs available yet." with no actual log collection. Accessible from user settings but provides no value.
- **Fix**: Implement log collection or remove the screen and its navigation entry.

### 34. Duplicate Model Pages
- **File**: `app/models.tsx` vs `app/project/.../models.tsx`
- **Severity**: MEDIUM
- **Problem**: Two separate model selection pages with nearly identical code. `app/models.tsx` is a read-only viewer, `app/project/.../models.tsx` has selection logic.
- **Fix**: Consolidate into one component with optional selection mode.

### 35. Duplicate Markdown Components
- **File**: `components/memo-markdown.tsx` vs `components/markdown.tsx`
- **Severity**: MEDIUM
- **Problem**: Two markdown renderers exist. `memo-markdown.tsx` is memoized, `markdown.tsx` is not. Only the memoized one is used.
- **Fix**: Remove `markdown.tsx` if unused, or consolidate.

### 36. SessionItem Not Memoized
- **File**: `app/sessions.tsx:35-128`
- **Severity**: MEDIUM
- **Problem**: `SessionItem` is a regular function component. It re-renders every time the parent `SessionsScreen` re-renders (e.g., on search query change, filter change).
- **Fix**: Wrap with `React.memo`.

### 37. ConnectionItem Not Memoized
- **File**: `app/(tabs)/index.tsx:21-174`
- **Severity**: MEDIUM
- **Problem**: Same issue as SessionItem. Re-renders on every parent render.
- **Fix**: Wrap with `React.memo`.

### 38. DialogFooter Has No Loading Indicator
- **File**: `components/ui/dialog.tsx:59-89`
- **Severity**: MEDIUM
- **Problem**: `loading` prop disables buttons but shows no spinner or loading text. Users don't know if their action is processing.
- **Fix**: Add `ActivityIndicator` inside the confirm button when `loading` is true.

### 39. Share Modal Uses Share.share for "Copy"
- **File**: `components/share-session-modal.tsx:23`
- **Severity**: MEDIUM
- **Problem**: The "Copy" button uses `Share.share({ message: shareUrl })` which opens the system share sheet, not clipboard. Misleading UX - button says "Copy" but opens share dialog.
- **Fix**: Use `Clipboard.setStringAsync(shareUrl)` for actual copy behavior.

### 40. canSubmit Calculated on Every Render
- **File**: `components/question-block.tsx:158-162`
- **Severity**: MEDIUM
- **Problem**: `canSubmit` iterates all questions and selections on every render. Should be memoized.
- **Fix**: Wrap in `useMemo`.

### 41. formatDirectory Mutates Array with splice
- **File**: `lib/utils.ts:16`
- **Severity**: MEDIUM
- **Problem**: `parts.splice(homeIdx, 2, '~')` mutates the `parts` array in place. While this works, it's a side effect in a utility function that should be pure.
- **Fix**: Use `slice` to create new array: `parts = [...parts.slice(0, homeIdx), '~', ...parts.slice(homeIdx + 2)]`.

### 42. Event Stream pendingMessages Mutated Directly
- **File**: `components/hooks/event-stream.ts:43-62`
- **Severity**: MEDIUM
- **Problem**: `pendingMessages` is a mutable array that's directly modified (push, splice, index assignment). While this is intentional for performance (avoiding spread on every SSE event), it could cause subtle bugs if React reads the array between mutations.
- **Fix**: Document this pattern clearly. The current approach is correct because the array is only read by `scheduleFlush` which copies it to the store.

### 43. Expandable Blocks Have Arbitrary maxHeight
- **File**: `components/bash-block.tsx`, `edit-block.tsx`, `tool-block.tsx`, `reasoning-block.tsx`
- **Severity**: MEDIUM
- **Problem**: Reanimated `maxHeight: progress.value * 2000` uses an arbitrary 2000px limit. Long bash output or large diffs will be clipped.
- **Fix**: Use a larger value or measure content height dynamically.

### 44. fetchProviders Doesn't Validate Data Shape
- **File**: `lib/models.ts:88-99`
- **Severity**: MEDIUM
- **Problem**: `Object.values(data)` could crash if `data` is `null` or a primitive. The function assumes the response is always an object.
- **Fix**: Add null/type check: `if (data && typeof data === "object") return Object.values(data)`.

### 45. fetchAgents Silent Failure
- **File**: `store/agents.store.ts:18-32`
- **Severity**: MEDIUM
- **Problem**: `fetchAgents` catches errors silently and keeps existing agents. No indication to the user that agent list may be stale.
- **Fix**: Consider logging errors or setting a `fetchError` state.

---

## Architecture Issues

### 46. Zustand Stores Subscribe to Entire State
- **Files**: Multiple screens
- **Severity**: HIGH
- **Problem**: Some components use `useStore()` without a selector, subscribing to the entire store. Any state change triggers re-render.
- **Locations**:
  - `app/(tabs)/index.tsx:180` - `useConnections()` destructured
  - `app/(tabs)/index.tsx:181` - `useProjects()` destructured
  - `app/sessions.tsx:134-136` - Multiple stores destructured
  - `app/project/.../index.tsx:54-66` - Multiple stores destructured
- **Fix**: Use individual selectors: `const connections = useConnections(s => s.connections)`.

### 47. No AbortController for Fetch Requests
- **Files**: All `lib/*.ts` fetch functions
- **Severity**: MEDIUM
- **Problem**: Fetch requests have no abort mechanism. If a screen unmounts while a fetch is in progress, the response handler still runs and may update state on an unmounted component.
- **Fix**: Pass an AbortController signal to fetch calls, or use a library like `react-query` / `swr` that handles this automatically.

### 48. No Request Deduplication
- **Files**: `app/project/.../index.tsx`, `app/sessions.tsx`, `app/models.tsx`
- **Severity**: MEDIUM
- **Problem**: Multiple `useEffect` hooks fire fetches on mount. If the component re-mounts quickly (e.g., navigation back and forth), duplicate requests are sent.
- **Fix**: Use a request cache or deduplication mechanism.

---

## Summary Statistics

| Severity | Count |
|----------|-------|
| CRITICAL | 11 |
| HIGH | 20 |
| MEDIUM | 14 |
| **Total** | **45** |

### Top Priority Fixes (Fix First)
1. **#5, #6** - Event stream cleanup (data loss + timer leak)
2. **#1, #2** - Memory leaks in modals/scanner
3. **#4** - Question block stuck in submitting state
4. **#8, #9, #10** - Missing HTTP error checks
5. **#11** - Splash screen infinite hang
6. **#3** - TodoBlock LayoutAnimation
7. **#46** - Zustand selector optimization
8. **#21** - Parallel health checks
9. **#27** - TypingDots migration to Reanimated
10. **#39** - Share vs Copy UX confusion
