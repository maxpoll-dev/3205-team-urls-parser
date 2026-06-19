export function formatDateTime(iso?: string): string {
  if (!iso) return '—'

  return new Date(iso).toLocaleString()
}

export function formatTime(iso?: string): string {
  if (!iso) return '—'

  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatDuration(ms?: number): string {
  if (ms == null) return '—'

  return `${(ms / 1000).toFixed(1)}s`
}
