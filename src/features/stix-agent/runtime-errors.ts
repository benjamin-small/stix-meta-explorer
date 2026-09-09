export function isMemoryFailure(error: unknown): boolean {
  return /out of memory|memory allocation|allocation failed|failed to allocate|could not allocate|unable to grow|memory.*(?:grow|limit|exhaust)/i.test(String(error));
}
