# Direct Linking to STIX Object Types

## Problem

Users cannot link directly to a specific STIX object type. Sharing a reference to a particular object (e.g., attack-pattern) requires telling someone to navigate to the page and search for it manually.

## Solution

Use query parameters to enable direct linking. The URL `?type=attack-pattern` opens the DetailDrawer for that object type on page load. The URL stays in sync with user interactions so any URL can be copied and shared.

## URL Format

```
https://<host>/stix-meta-explorer/?type=<object-type>
```

Example: `?type=attack-pattern`, `?type=malware`, `?type=ipv4-addr`

The `type` value matches the `type` field on `StixObjectType` (the STIX type string, e.g., `attack-pattern`, not the display name).

## Behavior

### On Page Load
- Use `URLSearchParams` to read the `type` parameter from the URL
- Look up the matching object in `stixObjects` by its `type` field (case-insensitive match for robustness)
- If found, set it as `selectedObject` (opens the DetailDrawer). Do not push a new history entry — the URL already has the correct state.
- If not found or absent, render the default page (no drawer open)

### When User Opens a Drawer (clicks a card)
- Call `history.pushState` to set `?type=<object-type>` in the URL
- Preserves any other query parameters if present

### When User Closes the Drawer
- Call `history.pushState` to remove the `?type` parameter from the URL

### Browser Back/Forward
- Listen for the `popstate` event on `window`
- On popstate, read the `type` param from the new URL and update `selectedObject` accordingly (open drawer if present, close if absent)

### popstate Listener Cleanup
- The `popstate` listener is added inside a `useEffect` and must be removed in the cleanup function to avoid leaks

## Files to Modify

- **`src/components/App.tsx`** — All changes are here:
  - Read `?type` on initial render to set `selectedObject`
  - Update URL when `selectedObject` changes
  - Listen for `popstate` to handle back/forward navigation

## Files NOT Modified

- Data layer (`src/data/*`)
- All other components (CardGrid, ObjectCard, DetailDrawer, ObjectDetail, etc.)
- Hooks (`useFilter`, `useForceGraph`)
- Build/deploy config
- Styles

## Edge Cases

- **Invalid type value:** Ignored — page loads normally with no drawer open
- **Case sensitivity:** `?type=Attack-Pattern` matches `attack-pattern` (case-insensitive lookup)
- **Multiple `type` params:** Use the first one
- **Interaction with search/filter:** The `type` param only controls the drawer. If the linked object's card is filtered out by category/search, the drawer still opens (the drawer is independent of filtering)
- **GitHub Pages compatibility:** Query parameters work natively with GitHub Pages, no server config needed

## Related

- GitHub Issue: #1
