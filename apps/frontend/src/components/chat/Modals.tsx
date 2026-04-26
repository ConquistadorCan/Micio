import { useState } from 'react'
import { Search, ArrowRight, Check } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { getGrad, getInitials } from '@/components/chat/utils'
import { useUserSearch } from '@/hooks/useUserSearch'
import type { UserMinimal } from '@micio/shared'

function ModalShell({ title, subtitle, onClose, children, footer, width = 480 }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; width?: number
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'oklch(0 0 0 / 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} className="animate-slide-up" style={{
        width, maxHeight: '85vh', background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '22px 24px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.025em' }}>{title}</h3>
              {subtitle && <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, color: 'var(--muted-foreground)', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--secondary)'}
              onMouseOut={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
            >×</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 20px' }}>{children}</div>
        {footer && <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', background: 'var(--popover)' }}>{footer}</div>}
      </div>
    </div>
  )
}

export function NewChatModal({ onClose, onPick }: {
  onClose: () => void; onPick: (userId: string) => void
}) {
  const { query, setQuery, results, loading, hasEnoughQuery } = useUserSearch()

  return (
    <ModalShell title="New conversation" subtitle="Pick someone to start a 1-on-1 chat with." onClose={onClose} width={460}>
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
        <input autoFocus className="micio-input micio-input-lg" placeholder="Search by nickname…" value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 42 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!hasEnoughQuery && <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>Type at least 2 characters.</div>}
        {hasEnoughQuery && loading && <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>Searching…</div>}
        {hasEnoughQuery && !loading && results.length === 0 && <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>No one found.</div>}
        {results.map(u => (
          <button key={u.id} onClick={() => onPick(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, textAlign: 'left', transition: 'background 0.12s' }}
            onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--secondary)'}
            onMouseOut={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
          >
            <Avatar user={u} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>@{u.nickname}</div>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        ))}
      </div>
    </ModalShell>
  )
}

export function NewGroupModal({ onClose, onCreate }: {
  onClose: () => void; onCreate: (name: string, memberIds: string[]) => void
}) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<UserMinimal[]>([])
  const { query, setQuery, results, loading, hasEnoughQuery } = useUserSearch()

  const toggle = (id: string) => {
    setSelected(current => {
      const exists = current.some(user => user.id === id)
      if (exists) return current.filter(user => user.id !== id)

      const user = results.find(candidate => candidate.id === id)
      return user ? [...current, user] : current
    })
  }

  const canCreate = name.trim().length > 0 && selected.length >= 2

  return (
    <ModalShell
      title="New group"
      subtitle="Name your group and pick at least 2 other people."
      onClose={onClose}
      width={520}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{selected.length} selected</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} className="btn btn-ghost" style={{ height: 40 }}>Cancel</button>
            <button
              onClick={() => canCreate && onCreate(name.trim(), selected.map(user => user.id))}
              className="btn btn-primary"
              style={{ height: 40, opacity: canCreate ? 1 : 0.5, pointerEvents: canCreate ? 'auto' : 'none' }}
            >Create group</button>
          </div>
        </div>
      }
    >
      <div style={{ marginBottom: 14 }}>
        <label className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', display: 'block', marginBottom: 6, paddingLeft: 4 }}>Group name</label>
        <input autoFocus className="micio-input micio-input-lg" placeholder="e.g. Weekend Crew" value={name} onChange={e => setName(e.target.value)} />
      </div>

      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, padding: 10, background: 'var(--secondary)', borderRadius: 14 }}>
          {selected.map(u => {
            return (
              <span key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 4px', background: 'var(--primary)', color: 'white', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                <div style={{ width: 20, height: 20, borderRadius: 999, background: getGrad(u.id), fontSize: 9, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getInitials(u.nickname)}</div>
                {u.nickname}
                <button onClick={() => toggle(u.id)} style={{ width: 18, height: 18, borderRadius: 999, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0.8 }}>×</button>
              </span>
            )
          })}
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
        <input className="micio-input" placeholder="Search people…" value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 42, height: 44 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 300, overflow: 'auto' }}>
        {!hasEnoughQuery && <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>Type at least 2 characters.</div>}
        {hasEnoughQuery && loading && <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>Searching…</div>}
        {hasEnoughQuery && !loading && results.length === 0 && <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>No one found.</div>}
        {results.map(u => {
          const isSel = selected.some(user => user.id === u.id)
          return (
            <button key={u.id} onClick={() => toggle(u.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, textAlign: 'left', transition: 'background 0.12s',
              background: isSel ? 'var(--primary-soft)' : 'transparent',
            }}
              onMouseOver={e => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = 'var(--secondary)' }}
              onMouseOut={e => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <Avatar user={u} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>@{u.nickname}</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                border: '2px solid ' + (isSel ? 'var(--primary)' : 'var(--border-strong)'),
                background: isSel ? 'var(--primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'all 0.15s',
              }}>
                {isSel && <Check size={13} strokeWidth={3} />}
              </div>
            </button>
          )
        })}
      </div>
    </ModalShell>
  )
}
