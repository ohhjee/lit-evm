export function randomAmount(min: number, max: number, decimals = 6): string {
  const value = Math.random() * (max - min) + min;
  return value.toFixed(decimals);
}

export function randomDelay(minMs: number, maxMs: number) {
  return Math.floor(Math.random() * (maxMs - minMs) + minMs);
}
