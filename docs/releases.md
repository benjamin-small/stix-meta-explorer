# Releases

stix-meta-explorer uses semantic versioning when it publishes versioned artifacts. User-visible changes should be summarized in release notes, including upgrade steps and breaking changes.

Before a release, run the repository's documented validation commands, confirm generated artifacts are current, and verify the release from a clean checkout.

The optional STIX assistant's generated model and WASM files use a versioned GitHub release archive. `scripts/agent/release-lock.json` pins its URL, size and SHA-256 hashes; Pages installs it before building. Publish the archive before merging the corresponding lock to main. See [publication instructions](stix-agent.md#github-pages-publication).
