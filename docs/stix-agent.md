# Optional local STIX assistant

The assistant is isolated in `src/features/stix-agent`, with one integration point in `App.tsx`. `VITE_STIX_AGENT=true` enables the **Ask STIX** edge tab. The default is disabled. Opening the tab dynamically imports a lightweight device preflight. It starts the inference panel and dedicated worker only when the device policy permits it; no model, corpus, WASM, GPU allocation, or inference worker is started beforehand. Closing the panel terminates the worker and releases its model resources. Verified model files remain in the browser's `stix-agent-models-v1` cache for reopening.

## Start the installed local prototype

Create `.env.development.local` containing:

```dotenv
VITE_STIX_AGENT=true
```

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173/stix-meta-explorer/`, then **Ask STIX**. Existing local model assets are under `public/stix-agent/model/`; these large files are intentionally ignored by Git. A fresh clone can run `npm run agent:release:install` to download the pinned prebuilt model and WASM release; no Rust or training environment is needed for this path. The setup/training commands below reproduce the model itself. A missing bundle produces an actionable error in the sidebar and leaves the explorer usable.

For Windows connecting to this Mac, run this on Windows while the development server is running:

```powershell
ssh -N -o ExitOnForwardFailure=yes -L 127.0.0.1:5173:127.0.0.1:5173 bsmall@10.0.0.130
```

Then open the same localhost URL in Windows Chrome. The model runs on the Windows computer. HTTPS or a trustworthy localhost origin is required for WebGPU, CacheStorage and model SHA-256 verification. The Mac serves static files; there is no remote inference API.

## Build and feature flag

```bash
npm run build                         # default: assistant disabled
VITE_STIX_AGENT=true npm run build     # include the enabled edge tab
npm run preview -- --host 127.0.0.1
```

This is a Vite build-time flag; changing it requires restarting the dev server or rebuilding. `.env.development.local` affects development only. The GitHub Pages workflow explicitly enables the flag after installing the pinned prebuilt release. Ordinary builds still default to disabled. All URLs respect the existing `/stix-meta-explorer/` base path. A host that enables the feature must also serve the generated model/runtime assets at that path. The flag is a product toggle, not an access-control mechanism.

## Memory requirements and mobile protection

The current model has used about 1.9 GB of WASM memory on desktop, before additional GPU buffers, JavaScript allocations, and browser overhead. Its 233 MB download is not its working memory requirement. CPU mode still loads the same large model.

The lightweight preflight runs before importing the inference panel or creating its worker:

- Phones and tablets are blocked for this model, including iPhone browsers, Android, and iPadOS reporting a desktop Mac identity with touch support. The sidebar explains the limitation and returns users to the ordinary explorer.
- Desktops reporting 4 GB of RAM or less through `navigator.deviceMemory` are blocked. At least 8 GB device RAM is recommended; this is a conservative product policy, not a measured minimum or guarantee of available memory.
- Desktops without that API require an explicit **Load desktop model** action after displaying the requirements. Missing, invalid, or zero memory values are treated as unknown, not as safe.
- A per-tab session marker is written before model startup and kept through inference. After an interrupted session, reopening the sidebar requires explicit loading even on an otherwise supported desktop. A normal page refresh can also leave the marker; it does not prove a crash. Stop, close, and handled fatal errors terminate the worker and clear its marker. If storage is unavailable, each opening requires explicit loading.

[`deviceMemory`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory) reports coarse, privacy-limited **total device RAM**, not currently free RAM or the browser tab's allocation limit, and is not available in every browser. There is no portable preflight that can guarantee an allocation will succeed. Device detection can miss spoofed or reduced identities. A hard renderer/OS termination cannot be caught by JavaScript; the preflight and reload guard reduce exposure, while catchable runtime errors now release the worker immediately. No artificial large-allocation probe is used.

This release prevents the unsupported mobile model load; it does not add mobile inference or a reference-only chatbot. The main STIX object explorer and its search remain available.

## Runtime and isolation

- Patched Flare at the existing POC's pinned revision runs SmolLM2-360M-Instruct in Rust/WASM, with asynchronous WebGPU decoding and CPU prefill. GPU initialization failure falls back to CPU. The performance panel checks finite logits, GPU-resident weights and GPU KV state after decoding; capability detection alone is not labelled verified decoding.
- STIX retrieval is a separate Rust/WASM crate, `crates/stix-agent-core`. It ranks object names, aliases, exact property names, relationship direction, and explanatory reference cards. Conversational pronouns can use the previous or currently selected object type.
- Maximum context is 2,048 tokens, with 256 tokens reserved for the response. Conversation history is used only to resolve the subject of follow-up questions; previous generated answers are never replayed into the model. Each generation receives the current question and fresh references. Lower-ranked references are removed if needed. Oversized current questions are rejected. ChatML delimiters in questions and references are escaped.
- Stop terminates the worker immediately, including during synchronous CPU prefill. Resume reloads the cached model; completed user turns resolve follow-up subjects again. New chat clears turns and retrieval context. Closing the sidebar also clears the conversation; reopening starts a new chat.
- Model/tokenizer files are SHA-256 checked. All inference assets use same-origin URLs. Prompts are passed only to the local worker; they are not sent to analytics or an LLM service. OASIS links open only when the user follows a reference.
- No global service worker or changes to the explorer's data stores are introduced. Model caching survives reopening; a fully offline reload of the entire explorer is not guaranteed by this feature.

## Reproduce training and export

Requires Apple Silicon for MLX training, Python 3.14 (the recorded environment), Rust with the `wasm32-unknown-unknown` target, wasm-pack, CMake, and the native C/C++ build tools. Inference clients do not need Python, Rust, or MLX.

```bash
npm run agent:setup
# On this machine the existing pinned POC inputs can be reused:
# npm run agent:setup -- --from-poc /Users/bsmall/dev/llm-in-browser
npm run agent:data
npm run agent:train
npm run agent:export
npm run agent:evaluate
npm run agent:assets
node scripts/agent/check_parity.mjs
.agent-venv/bin/python scripts/agent/audit_data.py
python3 scripts/agent/fresh_check.py
```

`agent:setup` is the explicit network step: it downloads pinned OASIS sources, Flare, llama.cpp, the base model and Python dependencies. Training and evaluation are local. The OASIS HTML and schema archive are hash checked. The Flare patch is included and pinned by SHA-256. `--from-poc` can reuse the prior working runtime and native conversion toolchain. For an already trained portable bundle, use `npm run agent:assets -- --bundle /path/to/bundle`; install the runtime inputs first.

The default LoRA settings are rank 16, learning rate `1e-4`, batch size 4, 1,024-token sequences, 600 updates, seed 730 and prompt-loss masking. The best actual checkpoint by validation loss is retained, including a final-checkpoint comparison. Dataset file hashes are checked before and after training. The original tokenizer, chat template and special-token configuration are preserved during fusion. Export produces Q8_0 and Q4_0 GGUF bundles with provenance, training settings, quantization and file hashes. Q4 blocks are expanded losslessly to Q8 in memory by the Flare patch; download size is smaller but memory use is not quarter precision end-to-end.

`public/stix-agent/knowledge.json` is an explanatory reference derived from the normative [OASIS STIX 2.1 specification](https://docs.oasis-open.org/cti/stix/v2.1/os/stix-v2.1-os.html) and the pinned [non-normative JSON schemas](https://github.com/oasis-open/cti-stix2-json-schemas/tree/c4f8d589acf2bdb3783655c89e0ffb6e150006ae). It covers 43 object types, common and specific properties, forward relationships, and selected general concepts. It is separate from the explorer's existing hand-written tables, which are left unchanged. References retain direct source links and OASIS notices. It does not index every extension, vocabulary entry, or pattern grammar rule.

Training examples vary wording and distractor references, include follow-ups and uncertainty, and exclude selected reference-card IDs from both targets and distractors before paraphrasing. Common semantic rules can recur in other cards, and the pretrained base may already know STIX: withheld-card evaluation is not evidence of wholly unseen knowledge. The model is trained to answer with references; without retrieval it may abstain frequently. Dataset, training, adapters, model variants and evaluation outputs live in `.agent-artifacts/` and are not committed as large binaries.

The generated `test.jsonl` is a loader-compatibility placeholder copied from validation, and is not used to report quality. The separate `evaluation.json`, evaluation `cases.json`, and additional wording suite supply the reported quality checks. Review full responses as well as the automated grades: the current model can mix relationship examples even when its opening sentence and citation IDs look correct.

## Verification and limits

```bash
npm test
npm run agent:test:rust
npm run lint
npm run build
```

The local evaluation compares base, base with retrieval, tuned, and tuned with retrieval, and checks Q8 versus Q4. Reports retain actual prompts, evidence, token IDs, outputs, hashes and native timing. Heuristic substring checks and reference reproduction can both miss semantic errors and reject correct paraphrases; they are not a STIX validator or a broad expert benchmark. After using questions to fix an issue, those questions are regression cases. Browser timing is measured separately from native Metal timing. See `docs/stix-agent-validation.md` for the measured result and remaining limitations.

This assistant explains STIX and suggests modeling rules. It does not execute actions, infer live threat intelligence, or certify whole bundles as conformant. Consult the linked normative rule for decisions that need exact conformance.

## Licenses

Flare's MIT notice is included in `public/stix-agent/FLARE-LICENSE.txt`. The model is derived from HuggingFaceTB/SmolLM2-360M-Instruct under Apache-2.0; its model license is included alongside the source notices. OASIS explanatory material is accompanied by the complete OASIS notices. The modified runtime and trained model are identified in the bundle manifest. Other build/runtime dependencies retain their respective licenses.

## GitHub Pages publication

The public site is https://benjamin-small.github.io/stix-meta-explorer/. The workflow downloads the archive pinned in `scripts/agent/release-lock.json`, verifies the archive and every member, checks that the reference corpus matches this checkout, then builds with `VITE_STIX_AGENT=true`. The model, tokenizer and WASM are served from the same Pages origin as the app. No Python, training job, or inference server runs for visitors.

Large generated files stay out of Git. They are published in the `stix-agent-v0.1.0` GitHub release. To install the validated prebuilt assets locally:

```bash
npm run agent:release:install
VITE_STIX_AGENT=true npm run build
```

For future model/runtime releases, finish evaluation and `agent:assets`, then package a new semantic version (do not replace an existing release asset):

```bash
npm run agent:release:pack -- --tag stix-agent-v0.2.0
```

Commit the updated release lock and matching reference/runtime manifests, and publish the resulting `.agent-artifacts/releases/*.zip` to that tag before pushing the enabled deployment workflow to main. Verify from a clean checkout with `agent:release:install`, tests and an enabled build. The pack/install tools use Python 3.11 or newer. Neither tool retrains the model. Reverting the deployment commit restores the previous Pages behavior.

## Conversation repetition regression

The original build replayed previous assistant answers as ChatML history. This caused exact repetitions and invented properties after topic changes, even with the correct current references. The same behavior reproduced in native llama.cpp, so it was not a browser UI or Flare cache problem. The worker now reconstructs subject context from completed user turns and sends only the current question and current evidence to generation. Assistant answers remain in the visible conversation but are never treated as reference evidence.

Run `node scripts/agent/check_conversation.mjs` after installing the release assets to exercise real WASM generation through the same prompt preparation used by the worker. It covers topic changes, missing properties, off-topic questions, pronoun follow-ups and a new chat. This targets conversation isolation; the model can still be incomplete or incorrect on modeling advice.
