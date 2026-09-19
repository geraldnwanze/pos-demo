/** Deterministic pseudo-random generator so mock data is stable across reloads. */
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const rand = mulberry32(20240917)

export function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

export function pickWeighted<T>(entries: readonly [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [value, weight] of entries) {
    r -= weight
    if (r <= 0) return value
  }
  return entries[0][0]
}

let counter = 1000
export function seq(prefix: string): string {
  counter += 1
  return `${prefix}-${counter}`
}
