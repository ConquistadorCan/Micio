import { getGrad, getInitials } from '@/components/chat/utils'
import type { LocalConv, UserMin } from '@/components/chat/types'

export function Avatar({ user, size = 36 }: { user: UserMin; size?: number }) {
  return (
    <div className="micio-avatar" style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}>
      <div className="micio-avatar-inner" style={{ background: getGrad(user.id) }}>
        <span>{getInitials(user.nickname)}</span>
      </div>
    </div>
  )
}

export function GroupAvatar({ conv, meId, size = 36 }: { conv: LocalConv; meId: string; size?: number }) {
  const others = conv.participants.filter(p => p.id !== meId).slice(0, 2)
  return (
    <div className="micio-avatar" style={{ width: size, height: size, background: 'transparent', position: 'relative' }}>
      {others.map((u, i) => (
        <div key={u.id} style={{
          position: 'absolute', width: size * 0.72, height: size * 0.72, borderRadius: 999,
          background: getGrad(u.id), display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.3, fontWeight: 700, color: 'white',
          border: '2px solid var(--sidebar)',
          top: i === 0 ? 0 : '28%', left: i === 0 ? 0 : '28%', zIndex: i,
        }}>{getInitials(u.nickname)}</div>
      ))}
    </div>
  )
}
