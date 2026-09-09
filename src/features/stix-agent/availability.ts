type DeviceHints = {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
  deviceMemory?: number;
  userAgentData?: { mobile?: boolean };
};
export type Availability = { status: 'blocked' | 'confirm' | 'allowed'; reason: 'mobile' | 'memory' | 'unknown' | 'supported'; memoryGB?: number };

// deviceMemory estimates total RAM, not free memory or the renderer's limit.
// These are conservative product limits for this model, not a memory guarantee.
export function assessDevice(device: DeviceHints): Availability {
  const reported = device.deviceMemory;
  const memoryGB = typeof reported === 'number' && Number.isFinite(reported) && reported > 0 ? reported : undefined;
  const mobile = device.userAgentData?.mobile === true
    || /Android|iPhone|iPad|iPod|Mobile/i.test(device.userAgent || '')
    || (/Mac/i.test(device.platform || device.userAgent || '') && (device.maxTouchPoints || 0) > 1);
  if (mobile) return { status: 'blocked', reason: 'mobile', memoryGB };
  if (memoryGB !== undefined && memoryGB <= 4) return { status: 'blocked', reason: 'memory', memoryGB };
  if (memoryGB === undefined) return { status: 'confirm', reason: 'unknown' };
  return { status: 'allowed', reason: 'supported', memoryGB };
}

const SESSION_KEY = 'stix-agent-runtime-active-v1';
// Per-tab storage survives reload without locking out other open explorer tabs.
// An ordinary refresh can also leave this marker; it is not a crash diagnosis.
export function previousRuntimeSession(): 'interrupted' | 'unavailable' | null {
  try { return sessionStorage.getItem(SESSION_KEY) ? 'interrupted' : null; }
  catch { return 'unavailable'; }
}
export function startRuntimeSession(): () => void {
  const token = crypto.randomUUID();
  try { sessionStorage.setItem(SESSION_KEY, token); } catch { /* Launcher requires an explicit load if storage is unavailable. */ }
  return () => {
    try { if (sessionStorage.getItem(SESSION_KEY) === token) sessionStorage.removeItem(SESSION_KEY); }
    catch { /* Storage may become unavailable after initialization. */ }
  };
}
