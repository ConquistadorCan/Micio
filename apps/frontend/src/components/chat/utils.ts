export const AV_COLORS = [
  'linear-gradient(135deg, oklch(0.65 0.22 292), oklch(0.55 0.24 280))',
  'linear-gradient(135deg, oklch(0.72 0.15 156), oklch(0.58 0.18 170))',
  'linear-gradient(135deg, oklch(0.78 0.12 246), oklch(0.60 0.18 260))',
  'linear-gradient(135deg, oklch(0.74 0.17 50), oklch(0.63 0.20 30))',
  'linear-gradient(135deg, oklch(0.72 0.12 20), oklch(0.60 0.18 0))',
  'linear-gradient(135deg, oklch(0.70 0.13 310), oklch(0.55 0.18 330))',
  'linear-gradient(135deg, oklch(0.70 0.14 180), oklch(0.58 0.18 200))',
  'linear-gradient(135deg, oklch(0.74 0.14 90), oklch(0.62 0.17 70))',
]

export function getGrad(id: string): string {
  let h = 0
  for (const c of id) h = ((h << 5) - h) + c.charCodeAt(0)
  return AV_COLORS[Math.abs(h) % AV_COLORS.length]
}

export function getInitials(nickname: string): string {
  return nickname.slice(0, 2).toUpperCase()
}

export function formatTime(d: string | Date | undefined): string {
  if (!d) return 'now'
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return 'now'
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diffMin < 1) return 'now'
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}
