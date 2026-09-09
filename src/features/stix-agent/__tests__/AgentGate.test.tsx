import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import AgentGate from '../AgentGate';
import type { Response } from '../protocol';
import { previousRuntimeSession, startRuntimeSession } from '../availability';

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage?: (event: { data: Response }) => void;
  onerror?: (event: { message: string }) => void;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { FakeWorker.instances.push(this); }
  ready() { this.onmessage?.({ data: { type: 'ready', id: 'init', backend: { backend: 'cpu' }, cached: true, manifest: {} as never } }); }
}
beforeEach(() => {
  sessionStorage.clear();
  FakeWorker.instances = [];
  vi.stubGlobal('Worker', FakeWorker);
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32', maxTouchPoints: 0, deviceMemory: 8 });
  vi.stubGlobal('isSecureContext', true);
  vi.stubEnv('VITE_STIX_AGENT', 'true');
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); sessionStorage.clear(); });

test('disabled flag renders no trigger and never creates a worker', () => {
  vi.stubEnv('VITE_STIX_AGENT', 'false');
  render(<AgentGate />);
  expect(screen.queryByRole('button', { name: /Ask STIX/ })).toBeNull();
  expect(FakeWorker.instances).toHaveLength(0);
});
test('enabled feature stays dormant until opened, and closing terminates its worker', async () => {
  render(<AgentGate />);
  expect(FakeWorker.instances).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: /Ask STIX/ }));
  await screen.findByRole('dialog', { name: /STIX assistant/ });
  // The panel can render before its passive effect creates the worker.
  await waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
  expect(FakeWorker.instances[0].postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'init', manifestUrl: expect.stringContaining('/stix-agent/model/manifest.json') }));
  fireEvent.click(screen.getByRole('button', { name: 'Close STIX assistant' }));
  expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();
  expect(previousRuntimeSession()).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
});
test('stop ends loading immediately and resume starts a fresh worker', async () => {
  render(<AgentGate />);
  fireEvent.click(screen.getByRole('button', { name: /Ask STIX/ }));
  await screen.findByRole('dialog');
  await waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
  expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();
  expect(previousRuntimeSession()).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Resume chat' }));
  await waitFor(() => expect(FakeWorker.instances).toHaveLength(2));
});
test('insecure context provides a useful error without starting a worker', async () => {
  vi.stubGlobal('isSecureContext', false);
  render(<AgentGate />);
  fireEvent.click(screen.getByRole('button', { name: /Ask STIX/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('localhost SSH tunnel');
  expect(FakeWorker.instances).toHaveLength(0);
});

test.each([
  { userAgent: 'iPhone Safari', deviceMemory: undefined },
  { userAgent: 'iPhone CriOS', deviceMemory: undefined },
  { platform: 'MacIntel', maxTouchPoints: 5 },
  { userAgent: 'Android', deviceMemory: 16 },
  { deviceMemory: 4 },
  { deviceMemory: 2 },
])('blocked device %j cannot load model, including after reopening', async hints => {
  vi.stubGlobal('navigator', { userAgent: 'Desktop', deviceMemory: 8, ...hints });
  render(<AgentGate />);
  for (let i = 0; i < 2; i++) {
    fireEvent.click(screen.getByRole('button', { name: /Ask STIX/ }));
    expect(await screen.findByRole('heading', { name: 'Local AI unavailable on this device' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Load desktop model' })).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(FakeWorker.instances).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Back to explorer' }));
  }
});
test('unknown desktop RAM waits for explicit loading', async () => {
  vi.stubGlobal('navigator', { platform: 'MacIntel', maxTouchPoints: 0 });
  render(<AgentGate />);
  fireEvent.click(screen.getByRole('button', { name: /Ask STIX/ }));
  expect(await screen.findByRole('status')).toHaveTextContent('does not report device RAM');
  expect(FakeWorker.instances).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Load desktop model' }));
  await waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
});
test('interrupted session requires explicit loading even on a supported desktop', async () => {
  startRuntimeSession(); // Simulate a renderer ending without running cleanup.
  render(<AgentGate />);
  fireEvent.click(screen.getByRole('button', { name: /Ask STIX/ }));
  expect(await screen.findByRole('heading', { name: 'Model reload paused' })).toBeVisible();
  expect(FakeWorker.instances).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Load desktop model' }));
  await waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
  FakeWorker.instances[0].ready();
  await screen.findByText(/STIX model ready/);
  expect(previousRuntimeSession()).toBe('interrupted'); // Keep guard during inference too.
  fireEvent.click(screen.getByRole('button', { name: 'Close STIX assistant' }));
  expect(previousRuntimeSession()).toBeNull();
});
test.each(['message', 'worker'] as const)('fatal %s errors unload allocations and permit an explicit retry', async kind => {
  render(<AgentGate />);
  fireEvent.click(screen.getByRole('button', { name: /Ask STIX/ }));
  await waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
  const instance = FakeWorker.instances[0];
  if (kind === 'message') instance.onmessage?.({ data: { type: 'error', id: 'init', fatal: true, message: 'Allocation failed' } });
  else instance.onerror?.({ message: 'out of memory' });
  await screen.findByRole('alert');
  expect(instance.terminate).toHaveBeenCalledOnce();
  expect(previousRuntimeSession()).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading' }));
  await waitFor(() => expect(FakeWorker.instances).toHaveLength(2));
  expect(instance.terminate).toHaveBeenCalledOnce();
});
test('constructor failure leaves a useful error and clears the active marker', async () => {
  vi.stubGlobal('Worker', class { constructor() { throw Error('Worker allocation failed'); } });
  render(<AgentGate />);
  fireEvent.click(screen.getByRole('button', { name: /Ask STIX/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not start the local runtime');
  expect(previousRuntimeSession()).toBeNull();
});
test('missing worker support blocks before loading', async () => {
  vi.stubGlobal('Worker', undefined);
  render(<AgentGate />);
  fireEvent.click(screen.getByRole('button', { name: /Ask STIX/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Web Worker and WebAssembly');
  expect(FakeWorker.instances).toHaveLength(0);
});
test('blocked preflight closes with Escape', async () => {
  vi.stubGlobal('navigator', { deviceMemory: 2 });
  render(<AgentGate />);
  fireEvent.click(screen.getByRole('button', { name: /Ask STIX/ }));
  await screen.findByRole('alert');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
});
