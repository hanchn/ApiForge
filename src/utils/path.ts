export function joinPathSegments(segments: string[]): string {
  return segments.filter(Boolean).join('/')
}

export function splitPath(p: string): string[] {
  return p.split('/').filter(Boolean)
}