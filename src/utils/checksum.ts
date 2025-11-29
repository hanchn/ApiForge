export function hashString(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) { h = (h << 5) - h + input.charCodeAt(i); h |= 0 }
  return ('00000000' + (h >>> 0).toString(16)).slice(-8)
}