# Hackers story walkthrough

The **Watch the story** view is separate from the complete narrative and the free-form explorer. Nine scenes retell the plot alongside a retrospective STIX teaching model. Scene prose describes film events; “Reading the graph” explains modeling choices and synthetic evidence. The evidence timestamps do not determine story order. The prologue uses a portrait of adult Dade as a character illustration, not a claim that the still depicts his childhood arrest.

`src/features/hackers/story-scenes.ts` owns the original scene summaries and the explicit introduction order. Every non-relationship object appears exactly once. Frames accumulate those objects and reveal structural connections only once both endpoints have appeared. The last frame contains all 40 nodes and 51 connections; the bundle's 35 relationship objects are represented by edges. Container references remain in the ordinary explorer.

The graph uses `@poietic-tech/graphing-library` throughout. The first frame loads once; later scenes use `previewNodes`/`commitPreview` to introduce objects into the mounted engine. Rewinding removes later edges and nodes. This preserves the evolving layout instead of reloading it for every scene. On each scene change, the camera fits all revealed nodes with padding and follows the changing bounds until the layout settles. This replaces the library's current-node camera follow. Manual pan, zoom, or dragging takes control immediately; the next scene refits again. The graph has a bounded height and stays alongside the text while scrolling on larger screens. The browser's reduced-motion preference disables layout animation.

Both graph views offer object preview cards on hover, showing the type, name, description (or note/opinion text), STIX ID, and aliases or observable details when present. Cards stay open while the pointer is over them, fit within the browser viewport, and close with Escape, the close button, scrolling outside the card, or graph interaction. Focus the graph and use arrow keys to preview the currently revealed objects with a keyboard. Select nodes directly in the graph to inspect them. Previews are nonmodal, do not steal focus, and leave narration running. Scene changes dismiss the previous preview; unrevealed objects cannot be previewed.

Moving across empty graph space keeps the current card open, so a small or moving node is not a fragile hover target. After leaving the graph or card, there is a 700 ms grace period to reach the other area. Entering the card cancels any pending replacement from a node crossed along the way. Clicking outside the card dismisses it immediately.

Scene changes are always manual: use **Previous scene**, **Next scene**, or a chapter button. There is no reading timer, automatic advance, or pause-after-scene setting. Each choice updates the shareable scene URL and browser history. Scene changes and Back/Forward cancel narration; the new scene waits for an explicit read-aloud request. Graph dragging, panning, zooming (including Fit), and object inspection keep narration running. Hiding the document pauses narration. Opening an object in the separate explorer leaves the walkthrough and stops speech. The revealed-object list is the keyboard and non-WebGL alternative to canvas selection.

**Read scene aloud** is optional and starts only when pressed. It reads the current scene heading, story paragraph, and “Reading the graph” note. **Pause narration** and **Resume narration** control that speech, and **Read scene again** repeats the same scene after completion. Finishing narration never advances the story, including the final scene. It uses the browser's Web Speech synthesis engine and automatically selects a preferred English voice from its available catalog. Voice availability and quality depend on the browser and operating system. No recorded narration files or additional service are configured by the app. This is a narration control, not a replacement for assistive screen-reader software.

`narration-voices.ts` ranks voices by quality hints in their name/URI: Natural, Neural, or Premium; Enhanced; Google or Siri; Alex or Samantha; then other system voices. Novelty voices are deprioritized. Within a tier, the browser's preferred English dialect wins, then its default voice, then local service; remaining ties are stable. Only English voices are explicitly selected. This is a heuristic preference, not an objective quality measurement: [Web Speech voice metadata](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice) provides no quality score, and no voice is guaranteed to be exposed in every browser. Examples of quality hints come from [Microsoft's natural/neural voice naming](https://blogs.windows.com/msedgedev/2019/08/14/cloud-powered-voices-microsoft-edge-chromium/) and [Apple's enhanced voices](https://support.apple.com/en-ie/111798).

The catalog is read immediately and updated on `voiceschanged`. An initially empty catalog gets up to 1.2 seconds to populate before using the browser's English fallback. A later preferred voice applies to the next narration request, without restarting active or paused speech. Voice/network availability errors retry that scene once using the browser fallback. Other speech errors, or failure of that retry, show an error and allow another read-aloud request; manual navigation remains available. Some browser-provided voices use a remote speech service; local-service status is a tie-breaker, not a requirement.

The utterance's [end event](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/end_event) completes narration at 100% without changing the scene or URL. Word-boundary events update narration progress when the voice provides them. Scene changes and leaving the view cancel speech, and late events from canceled utterances are ignored. Browsers without the API disable only the narration button. The scene announcement live region is quiet while narration is playing to avoid a duplicate announcement.

## Connections explorer

The shared header uses a compact title row and view tabs. **Explore connections** keeps the full 40-node, 51-connection graph loaded when selecting objects in the browser, graph, references, or browser history. Selection changes camera position and styling without reloading the graph or restarting its layout. **Fit all** returns to the overview; pan and zoom remain available.

The selected node is gold. Its immediate neighbors and incident edges stay bright; nodes two or more hops away (and disconnected nodes) remain visible at lower opacity with their labels suppressed. Hover cards remain available on distant nodes. Selecting a relationship highlights its edge and both endpoints, and navigates to its source. Context objects with no structural edges remain in the full graph and retain references in the inspector. Selection framing keeps at least 85% of the overview camera distance to avoid zooming into an isolated object, and preserves a wider manual zoom. Camera transitions respect reduced motion.

On narrow screens, the graph appears before the inspector, and choosing an object brings the graph into view. Direct links ending in `#instance` still open the inspector. Search and type filters affect only the object browser, never the graph's node set.

## Graph labels

Both views use a shared label layer positioned from the graphing library's public screen coordinates. The library still owns the graph, physics, camera, and hit testing. Text stays at a readable size while zooming, accounts for display pixel density, and follows layout motion, pan, zoom, and panel resizing. The layer lets pointer events through to the canvas.

Labels try several positions around their nodes, turn inward near panel edges, and avoid other labels and node shapes. Selected objects take priority, followed by newly revealed story objects and relevant connections. A selected label can move farther out of a dense cluster, with a short connector back to its node. Long names use an ellipsis; lower-priority labels disappear when space is crowded. All nodes and connections remain present, and full names and details remain available in preview cards and the object lists. Relationship labels share the same collision rules and appear only when both endpoints are visible and sufficiently separated.

## Object shapes

Both the explorer and story graph share an explicit STIX type mapping in `graph-shapes.ts`. Version 0.9.0 of the graphing library supports three shapes: circles for people and groups, squares for systems and artifacts, and diamonds for actions and evidence (including case context). Intrusion sets use the activity diamond; the people/group circle is reserved for Threat Actors and Identities. The expandable **Object shapes** key lists every assigned type. Related types share a shape; selection and scene highlights change color/size without changing that shape. Relationship objects remain edges. No custom renderer or dependency replacement is involved.

## Film imagery

`story-media.ts` maps each scene to one visually reviewed still in the [Cinematic Freeze Hackers gallery](https://www.cinematicfreeze.com/hackers-1995-stills/). The gallery was inspected on October 10, 2026. The film is *Hackers* (1995), directed by Iain Softley, MGM/United Artists; these images are third-party film imagery, not original dataset material or assets covered by the dataset's MIT license. The gallery's own copyright statement does not establish a new license for this repository.

The nine original JPEGs are stored in `src/assets/hackers-1995/` and imported by `story-media.ts`. Vite emits versioned asset filenames under the configured base path, so development and production serve each image from the app's own origin. Neither builds nor visitors need to fetch image bytes from the gallery. The [asset provenance record](../src/assets/hackers-1995/README.md) lists the original URLs, download date, and SHA-256 checksums.

Each image has descriptive alternative text, a caption, and a source link. A failed request keeps its caption and source link in place, and resets the image state on the next scene. No GIFs, remote video players, or recorded audio load. To change a visual, add the local image, update its manifest entry and provenance record, and verify the still and caption together in a browser.

| Scene | Gallery still | Visual role |
| --- | --- | --- |
| Zero Cool | 01 | Dade's character portrait |
| Back online | 03 | The on-screen rivalry |
| The crew | 22 | Dade, Kate, and their friends |
| The intrusion | 46 | The Gibson's virtual file system |
| The worm | 10 | The Plague in the data center |
| The frame-up | 17 | Gill and the teenage suspects |
| Hack the Planet | 43 | The payphone counterattack |
| The evidence | 53 | Public video screens |
| Aftermath | 54 | Dade and Kate at the ending |

## Verification

Run `npm run lint`, `npm run build`, and `npm test`. Story tests cover complete and monotonic data revelation, incremental renderer updates and rewinding, manual navigation with no time-driven progression, graph interaction, scene history, image failures, and returning to the explorer. Shape tests enforce coverage of every rendered type. Narration tests cover opt-in, remaining on the current scene after speech ends, pause/resume, hidden documents, stale events, cancellation, repeating the current scene, errors, missing APIs, representative voice catalogs, delayed voice discovery, and bounded fallback. The graph and speech engines are mocked in unit tests. Check actual WASM shapes, node interaction, narration, manual forward/backward transitions, scene imagery, and narrow layouts in the browser as well.

Dataset and pattern changes also use `scripts/validate-hackers.py`; see the [dataset validation instructions](../src/data/hackers-1995/README.md#validation). Regression tests preserve shared links to the modem and its relationships after the Infrastructure correction.

Label tests cover panel boundaries, long names, selected-object priority, node/edge collisions, dense layouts at several widths, high-density displays, viewport changes, resizing, renderer idling, and cleanup. Browser checks should include narrow story and explorer panels, selected objects and relationships, and pan/zoom with hover cards still working.

## Story and modeling sources

The October 10, 2026 review cross-checked the [screenplay reproduction](https://assets.scriptslug.com/live/pdf/scripts/hackers-1995.pdf?v=1729114919) against [timecoded release subtitles](https://www.subtitlecat.com/subs/641/hackers.1995.remastered.bdrip.x264-gazer.html). These reproductions are source evidence, not a claim of a full independent film viewing. The screenplay's pages 75–76 and subtitles at approximately 01:30:44–01:31:02 support the Dade-to-Joey handoff: Dade is disconnected, Joey completes the retrieval, and Kate calls for shutdown. Pages 80–81 support Cereal's public exposure of the worm and account details. Nikon's introduction is a separate encounter, so the crew scene does not place every introduction at school. [Archived film promotional copy](https://www.ibiblio.org/team/history/hack/intro.html) confirms the writer's name, Rafael Moreu.

The dates, reserved addresses, HTTP URL, authored payload, hash, observations, and sightings are synthetic teaching evidence. The source-file objects are shared across observations; separate downloaded copies are not modeled. Their descriptions, graph notes, observation labels, and the case footer identify this distinction. SHA-256 detection and Gill's indicator sightings are not narrated as events in the film.

The STIX corrections follow [OASIS STIX 2.1](https://docs.oasis-open.org/cti/stix/v2.1/os/stix-v2.1-os.html): Tool represents software (§4.18), so modem equipment/connectivity is Infrastructure. “The Elite” labels correlated intrusion activity (§4.9); attribution links the actors responsible for activity, not social membership. `insider-disgruntled` requires a grievance motive (§10.23), which the reviewed evidence does not establish for Plague. His `criminal` classification and `personal-gain` motivation remain. [ATT&CK T1041](https://attack.mitre.org/techniques/T1041/) requires an existing C2 channel; this dataset explicitly states that its dial-up mapping assumes that role and protocol. The observation `AND` fixture is labeled “Trace and download (observation AND, either order)”; chronology would require `FOLLOWEDBY` (§9.5.2).
