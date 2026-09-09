# STIX assistant validation

Recorded 9 September 2026. This is a working local prototype with an actually fine-tuned SmolLM2-360M model, Rust/WASM retrieval, and verified browser WebGPU decoding. Production builds default to having the feature disabled. The installed development configuration enables the edge tab; opening it loads the assistant.

## Model and reference corpus

The reference corpus contains 1,055 cards covering 43 object types, common and specific properties, forward relationships, and selected modeling concepts. Sources are the [OASIS STIX 2.1 Standard, 10 June 2021](https://docs.oasis-open.org/cti/stix/v2.1/os/stix-v2.1-os.html) and [OASIS non-normative JSON schemas at c4f8d589](https://github.com/oasis-open/cti-stix2-json-schemas/tree/c4f8d589acf2bdb3783655c89e0ffb6e150006ae). The explorer's existing tables are unchanged.

| Item | Recorded value |
| --- | --- |
| Base model | HuggingFaceTB/SmolLM2-360M-Instruct |
| Base revision | `a10cc1512eabd3dde888204e902eca88bddb4951` |
| Dataset | `stix-2.1-agent-1.1.0` |
| Training / validation examples | 9,009 / 953 |
| LoRA | Rank 16, scale 20, 16 layers, no dropout |
| Training | 600 updates, learning rate 1e-4, batch 4, sequence 1,024, seed 730, prompt loss masked |
| Selected checkpoint | Actual step 399, validation loss 0.00062129 |
| Training wall time / peak MLX memory | 308.83 seconds / 6.390 GB |
| Q4_0 weights | 229,118,528 bytes |
| Q8_0 weights | 386,404,928 bytes |
| Q4 bundle, including tokenizer/config files | 231,227,826 bytes |
| Runtime JS and WASM files | 2,272,335 bytes, plus the reference corpus and prompt |

The complete settings, dependency versions, dataset hashes and provenance are in the installed bundle manifest. The original tokenizer and chat template were preserved. These are synthetic reference-answer examples: a very low validation loss mainly demonstrates learning the repetitive answer format, not broad STIX expertise.

```
Q4 SHA-256: b6bc4d842fbac3c9edc8c96c689f73ac834c17969adf03ebf75ac19d4d31114d
Q8 SHA-256: 0a72edf1dcc190072076d914af4925f4a9fee91a0fa8cc2bff3f516fb23a1fa4
Corpus SHA-256: 217afb16eda558bbef3ec978340ba8c09a776269bcec964f609cf05944f624ae
Flare revision: a8cb07cf54fa43c4e41664316498ed195fa7b018
Flare patch SHA-256: b50f6a694c85e2a74c8a4b9a7690ffa103db01d85eb8014a47e4a373f360b3e4
llama.cpp revision: f3f1a8f2760f28325a5ec20c05b171e5b7c83a29
```

## Answer evaluation

All configurations used the same 48 questions and deterministic generation settings. The 22 authored questions became regression cases during retrieval development. Twenty reference cards were excluded from training targets and distractors before paraphrasing. Six questions asked for unknown or nonexistent facts.

These first counts are **automated assertion passes**, not fully reviewed factual accuracy. Authored questions use substring checks; held-card questions require reproduction of the expected reference text. The latter can reject valid paraphrases, while substring checks can miss incorrect extra claims.

| Configuration | Authored regression, /22 | Held reference cards, /20 | Unknown handling, /6 | Responses citing IDs absent from evidence |
| --- | ---: | ---: | ---: | ---: |
| Base Q8 | 5 | 0 | 0 | 0 |
| Base Q8 + retrieval | 12 | 1 | 0 | 1 |
| Tuned Q4 | 0 | 0 | 6 | 0 |
| Tuned Q8 + retrieval | 19 | 20 | 6 | 0 |
| Tuned Q4 + retrieval | 21 | 20 | 6 | 0 |

Q4 is the installed default: this small comparison did not show a factual regression from Q8 quantization. Both variants are retained locally. The tuned model was trained to use supplied references and frequently abstains without them.

After freezing the model and retrieval, an additional 10 questions with new wording and two new unknown questions passed 10/10 and 2/2 automated checks. No model, prompt or retrieval changes were made from that result.

### Review of complete answers

Assistant review of the full Q4 + retrieval answers against their supplied references found **two incorrect relationship explanations that the substring checks missed**:

- `rel-threat-actor`: correctly lists the target types, then confuses targeting, campaign attribution and indicator detection, with a misleading citation. Count as incorrect.
- `fresh-exploit`: correctly states malware can exploit a vulnerability, then gives an incorrect example involving an Identity in the energy sector. Count as incorrect.

The original `revoke` regression also remains a failure: the model abstains even though the necessary rule is retrieved. The additional `fresh-observations` answer omits the minimum-one-SCO constraint, though it answers the question about the purpose of `object_refs`; it is incomplete as a validation checklist.

Accounting for those findings, the reviewed result is **40/42 supported answers (95.2%) and 6/6 unknown answers** on the original suite, and **9/10 supported answers (90%) and 2/2 unknown answers** on the additional wording check. Unsupported extra assertions were observed in 1/42 and 1/10 supported-answer responses respectively. This was an assistant review, not an independent human assessment. Zero invalid citation IDs does not imply that a citation actually supports the answer.

These small synthetic checks meet the prototype's 90% targets on these questions only. They do not establish general accuracy. Shared common-property semantics recur across cards, the pretrained base may already know STIX, and only 20 of the withheld cards were evaluated here. The suite does not establish coverage of every extension, vocabulary, pattern expression, or whole-bundle constraint. Event execution and live threat intelligence are outside this feature.

## Runtime and browser verification

- The shipped Rust/WASM retrieval and tokenizer matched the native reference runtime for **96 prompts and 22,938 token IDs**. Three short deterministic generations matched the first 16 native tokens. This parity test executed actual WASM in Node; GPU checks were separate.
- In the real in-app Chromium browser on this Mac, the tuned Q4 generated the required-indicator answer correctly with WebGPU. Diagnostics checked finite nonzero logits, GPU-resident weights, and GPU KV state after actual decoding. Browser prefill still runs on the CPU.
- A conversational `pattern_type` follow-up produced the correct field explanation. Stop terminated an active generation immediately; Resume loaded the cached model. New chat, close/reopen, forced CPU decoding, and an unknown-property answer were exercised.
- A deliberately missing model manifest produced a useful `npm run agent:assets` error and a retry control without breaking the explorer.
- A separately built disabled feature had no Ask STIX control. Request logs showed only HTML, main JS, main CSS and favicon before opening the enabled feature; no assistant chunk, worker, model, corpus or WASM was requested. Opening the feature requested its panel and worker chunks before the manifest.
- The sidebar was visually inspected in the real browser. Unit coverage separately verifies no worker before opening, worker termination on close/Stop, restart, an insecure-origin error, context bounds, ChatML escaping, and backend fallback.

Representative single-turn observations, with the final model loaded and no training running:

| Browser backend and question | Input / output tokens | First token | Decode speed | Observed WASM heap |
| --- | ---: | ---: | ---: | ---: |
| WebGPU: required indicator properties | 575 / 54 | 9.72 s | 10.1 tokens/s | 1,891 MB |
| Forced CPU: unknown indicator field | 571 / 29 | 9.34 s | 23.4 tokens/s | 1,891 MB |

These are different prompts and single observations, not a controlled GPU-versus-CPU benchmark. The native Metal evaluation median for Q4 + retrieval was about 410 tokens/s; that number is **not browser performance**. First-token timing excludes model loading. WASM heap is not total process memory: JavaScript buffers, GPU allocations, browser overhead and peak loading memory are not measured. Flare expands Q4 weights to Q8 in memory, so the 229 MB download does not imply a 229 MB working set.

Generation has no network request code: the UI sends prompts to its local worker, and inference/retrieval run there. All asset fetches are same-origin and happen at initialization. The request logs are server-side logs for the test origin, not a browser-wide external-request trace. OASIS links are opened only by following a reference. This feature caches model files but does not install an app-wide offline service worker; a completely offline page reload is not guaranteed.

Physical Windows Chrome, a device with no WebGPU, mobile browsers, and total GPU/process memory have not been measured. Real forced-CPU inference and injected backend-failure tests passed. Fresh-machine network bootstrap was not exercised end to end; this installation reused the verified pinned POC toolchain, then regenerated data, trained, exported and packaged the STIX model locally.

## Checks and artifacts

The installed target passed 74 TypeScript/UI tests in 16 files, four Rust tests, ESLint, TypeScript compilation and the Vite production build. Both enabled and disabled builds were exercised. Source formatting was checked with `git diff --check`. Dataset auditing found no held-card citation leaks and no training/validation examples over 1,024 tokens (observed maxima: 933 and 637).

Reproduction commands are in [stix-agent.md](stix-agent.md). Detailed local outputs are intentionally ignored by Git:

- `.agent-artifacts/training/summary.json` and `metrics.json`: actual training/checkpoint measurements.
- `.agent-artifacts/evaluation/summary.json` and configuration JSON files: raw automated grades, prompts, references, token IDs and native timing.
- `.agent-artifacts/evaluation/additional-wording.json` and `answer-review.json`: frozen additional check and reviewed corrections; raw grades are preserved.
- `.agent-artifacts/evaluation/wasm-parity.json`, `data-audit.json` and `browser.json`: parity, dataset and browser observations.
- `.agent-artifacts/bundles/q4_0` and `q8_0`: portable model bundles; `public/stix-agent/model` is the installed Q4 bundle.

The measurements above were recorded before publication. The subsequent Pages deployment packages these same validated model/runtime bytes in the `stix-agent-v0.1.0` release and enables the sidebar in the Pages workflow. Flare upstream publication is separate and was not performed.

## Conversation isolation fix

The first public release had a multi-turn failure missed by the single-question quality suite: after the malware-family name question, the Note/Location modeling question repeated the malware answer. The same input reproduced in native llama.cpp. Removing previous assistant answers from the input stopped the repeat with identical current references and model weights. History also caused an invented secret_access_token property in the control test; the isolated current prompt correctly abstained.

The worker now uses completed user turns only to resolve the subject for retrieval. Each generation gets fresh evidence and the current question. This preserves subject-based follow-ups and prevents replay of previous generated answers. Full conversation reasoning across prior answers is not claimed.

Validation after the fix: 78 UI/TypeScript tests, lint and the enabled build passed. `node scripts/agent/check_conversation.mjs` passed eight sequential cases using the actual shipped WASM model: malware name, the Note topic change, an unknown property, a known question after that unknown, a pronoun property follow-up, a missing pronoun property, an off-topic question and a fresh chat. Detailed output is in `.agent-artifacts/evaluation/conversation-regression.json`; the native history-versus-isolated control is in `history-control.json`. The model, tokenizer, reference corpus and WASM release hashes are unchanged.

The Note response now explains the Note reference instead of repeating malware facts; it is still an incomplete answer to the broader modeling decision about attack location. These are regression checks for conversation isolation, not a new broad accuracy benchmark.

## Device memory guard

After a report of repeated phone renderer crashes during model loading, the assistant now blocks phones/tablets and desktops reporting at most 4 GB RAM before importing the inference panel. Unknown desktop RAM, unavailable session storage, and interrupted model sessions require explicit loading. This is a conservative eligibility policy; it does not measure free RAM or prove that an eligible desktop can fit the model. Mobile inference remains unsupported.

The change passed 115 UI/TypeScript tests, five release-integrity tests, ESLint, and the enabled production build. Tests cover iPhone Safari/Chrome identities, Android, iPad desktop identity, low/unknown RAM, a Windows touch laptop, missing runtime support, storage failures, interrupted sessions, constructor failures, fatal worker errors, and cleanup ownership. Catchable allocation failures during generation are fatal and unload the worker; a renderer killed by the OS cannot run that handler.

Real Chromium validation used the production build with a temporary localhost HTML fixture that supplies controlled navigator hints (not a physical phone): phone and 2 GB desktop cases showed a non-loading explanation; unknown RAM waited for a load action. Server logs showed only the main app, lightweight launcher, shared helper and CSS, with no inference-panel chunk, worker, model, corpus or WASM requests on those guarded paths. The fixture is not shipped.

On the unmodified desktop browser, the actual model loaded and answered the malware-family-name question correctly. Refreshing while the model was resident left the interrupted-session marker, and reopening paused automatic loading. Explicit loading resumed successfully. No model, tokenizer, corpus, or WASM bytes changed. Physical iOS verification and total process/GPU memory measurement remain outstanding; this fix avoids the unsupported load rather than reducing model memory.
