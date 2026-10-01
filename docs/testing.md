# Testing

Run the test suite and coverage report with:

```sh
npm test
npm run coverage
```

As measured on August 27, 2026, the 67 tests across 14 files cover 80.62% of statements, 54.22% of branches, 75.96% of functions, and 83.95% of lines.

The tests cover STIX object, relationship, and example-data integrity; filter and URL-selection hooks; force-graph derivation; object cards and grids; detail and property presentation; JSON examples; and representative application-level interactions.

The assistant's voice-input tests use a fake speech recognizer and worker to cover microphone activation, evolving transcripts, preservation of existing drafts, manual sending, cancellation and cleanup, permission and service errors, missing browser APIs, and the message length limit. Run them with `npm test -- src/features/stix-agent/__tests__/voice-input.test.tsx`. Real microphone transcription also needs a supported browser check: open **Ask STIX**, click the microphone, grant microphone access, speak a question, stop dictation, review or edit the text, and send it. Verify that closing the sidebar ends microphone capture.

The largest remaining gaps are D3 relationship-graph rendering paths, some detail-view branches, and browser behaviors not modeled by the `happy-dom` unit-test environment. The suite does not replace end-to-end testing in a real browser.
