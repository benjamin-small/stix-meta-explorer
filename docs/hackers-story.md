# Hackers story walkthrough

The **Watch the story** view is separate from the complete narrative and the free-form explorer. Nine scenes follow the plot in the owned bundle's report. They use story order rather than the dataset's illustrative evidence timestamps. The prologue uses a portrait of adult Dade as a character illustration, not a claim that the still depicts his childhood arrest.

`src/features/hackers/story-scenes.ts` owns the original scene summaries and the explicit introduction order. Every non-relationship object appears exactly once. Frames accumulate those objects and reveal structural connections only once both endpoints have appeared. The last frame contains all 40 nodes and 51 connections; the bundle's 35 relationship objects are represented by edges. Container references remain in the ordinary explorer.

The graph uses `@poietic-tech/graphing-library` throughout. The first frame loads once; later scenes use `previewNodes`/`commitPreview` to introduce objects into the mounted engine. Rewinding removes later edges and nodes. This preserves the evolving layout instead of reloading it for every scene. The library animates the force layout and reframes when it settles; the browser's reduced-motion preference disables that motion.

Playback is opt-in, with scene durations based on the narrative length. Pause preserves elapsed reading time. Scene jumps, Back/Forward, and hiding the document pause playback. Graph dragging, panning, zooming (including Fit), and object inspection keep both timed playback and narration running. Opening an object in the separate explorer leaves the walkthrough and stops it. Automatic advances replace the scene URL rather than creating one history entry per timer. Leaving the view clears its timer. The revealed-object list is the keyboard and non-WebGL alternative to canvas selection.

**Pause after each scene** is a quick presentation setting, off by default. When enabled, the reading timer or complete narration finishes on the current scene, then holds its text and graph at 100% progress. **Play next scene** advances and starts the next scene on demand. Changing the setting during playback does not interrupt or restart the current scene. Disabling it while held does not start playback unexpectedly; the next Play resumes continuous progression. The final scene still offers **Replay story**. The setting stays selected through scene navigation and replay within the walkthrough.

**Read aloud** is optional and off initially. Enable it, then press Play to hear the scene heading, story paragraph, and “Reading the graph” note. It uses the browser's Web Speech synthesis engine and automatically selects a preferred English voice from its available catalog. Voice availability and quality depend on the browser and operating system. No recorded narration files or additional service are configured by the app. This is a narration control, not a replacement for assistive screen-reader software.

`narration-voices.ts` ranks voices by quality hints in their name/URI: Natural, Neural, or Premium; Enhanced; Google or Siri; Alex or Samantha; then other system voices. Novelty voices are deprioritized. Within a tier, the browser's preferred English dialect wins, then its default voice, then local service; remaining ties are stable. Only English voices are explicitly selected. This is a heuristic preference, not an objective quality measurement: [Web Speech voice metadata](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice) provides no quality score, and no voice is guaranteed to be exposed in every browser. Examples of quality hints come from [Microsoft's natural/neural voice naming](https://blogs.windows.com/msedgedev/2019/08/14/cloud-powered-voices-microsoft-edge-chromium/) and [Apple's enhanced voices](https://support.apple.com/en-ie/111798).

The catalog is read immediately and updated on `voiceschanged`. An initially empty catalog gets up to 1.2 seconds to populate before using the browser's English fallback. A later preferred voice applies at the next scene, without restarting active or paused speech. Voice/network availability errors retry that scene once using the browser fallback. Other speech errors, or failure of that retry, retain the recoverable silent-playback behavior. Some browser-provided voices use a remote speech service; local-service status is a tie-breaker, not a requirement.

Narrated playback advances on the utterance's [end event](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/end_event), not the reading timer, so slower voices are not cut off. Pause/resume controls both speech and progression. Word-boundary events update progress when the voice provides them. A scene jump cancels old speech and remains paused; turning narration off or leaving the view cancels it as well. Late events from canceled utterances are ignored. A speech error pauses the story and restores silent playback; browsers without the API disable only the narration control. The scene announcement live region is quiet while narration is enabled to avoid a duplicate announcement.

## Object shapes

Both the explorer and story graph share an explicit STIX type mapping in `graph-shapes.ts`. Version 0.9.0 of the graphing library supports three shapes: circles for people and groups, squares for systems and artifacts, and diamonds for actions and evidence (including case context). The expandable **Object shapes** key lists every assigned type. Related types share a shape; selection and scene highlights change color/size without changing that shape. Relationship objects remain edges. No custom renderer or dependency replacement is involved.

## Film imagery

`story-media.ts` maps each scene to one visually reviewed still in the [Cinematic Freeze Hackers gallery](https://www.cinematicfreeze.com/hackers-1995-stills/). The gallery was inspected on October 10, 2026. The film is *Hackers* (1995), directed by Iain Softley, MGM/United Artists; these images are third-party film imagery, not original dataset material or assets covered by the dataset's MIT license. The gallery's own copyright statement does not establish a new license for this repository.

The app references the externally hosted images rather than copying their binaries. Each image has descriptive alternative text, a caption, and a source link. Requests omit the referrer. A failed request keeps its caption and source link in place, and resets the image state on the next scene. No GIFs, remote video players, or recorded audio load. To change a visual, edit its manifest entry and verify the still and caption together in a browser.

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

Run `npm run lint`, `npm run build`, and `npm test`. Story tests cover complete and monotonic data revelation, incremental renderer updates and rewinding, playback/pause/resume/end/replay, uninterrupted graph interaction, per-scene presentation holds for timed and narrated playback, timer cleanup, hidden documents, scene history, image failures, and returning to the explorer. Shape tests enforce coverage of every rendered type. Narration tests cover opt-in, speech-driven advancement, pause/resume, stale events, cancellation, replay, errors, missing APIs, representative voice catalogs, delayed voice discovery, and bounded fallback. The graph and speech engines are mocked in unit tests. Check actual WASM shapes, node interaction, speech-driven progression, forward/backward transitions, scene imagery, and narrow layouts in the browser as well.
