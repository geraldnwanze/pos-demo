/** Generate a unique id with an optional prefix. */
export function genId(prefix = 'id'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${rand}`
}

let refCounter = Date.now() % 100000
export function nextRef(prefix: string, pad = 6): string {
  refCounter += 1
  return `${prefix}-${String(refCounter).padStart(pad, '0')}`
}
