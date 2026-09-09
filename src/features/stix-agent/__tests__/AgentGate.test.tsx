import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import AgentGate from '../AgentGate';
import type { Response } from '../protocol';

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage?: (event: { data: Response }) => void;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { FakeWorker.instances.push(this); }
  ready() { this.onmessage?.({ data: { type: 'ready', id: 'init', backend: { backend: 'cpu' }, cached: true, manifest: {} as never } }); }
}
beforeEach(() => {
  FakeWorker.instances = [];
  vi.stubGlobal('Worker', FakeWorker);
  vi.stubGlobal('isSecureContext', true);
  vi.stubEnv('VITE_STIX_AGENT', 'true');
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

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
  expect(screen.queryByRole('dialog')).toBeNull();
});
test('stop ends loading immediately and resume starts a fresh worker', async () => {
  render(<AgentGate />);
  fireEvent.click(screen.getByRole('button', { name: /Ask STIX/ }));
  await screen.findByRole('dialog');
  await waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
  expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();
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
