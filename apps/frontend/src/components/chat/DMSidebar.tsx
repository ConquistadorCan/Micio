import { useState } from 'react'
import { MessageSquare, Users, Search, Plus, MoreHorizontal, ArrowRight, X } from 'lucide-react'
import { Avatar, GroupAvatar } from '@/components/ui/avatar'
import { getGrad, getInitials } from '@/components/chat/utils'
import type { LocalConv } from '@/types/chat'

function MenuItem({ icon, label, hint, onClick, danger }: {
  icon: React.ReactNode; label: string; hint?: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '10px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
      color: danger ? 'var(--destructive)' : 'var(--foreground)', transition: 'background 0.12s',
    }}
      onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--secondary)'}
      onMouseOut={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
    >
      <span style={{ color: danger ? 'var(--destructive)' : 'var(--muted-foreground)', display: 'flex' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {hint && <div className="mono" style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 1 }}>{hint}</div>}
      </div>
    </button>
  )
}

function DMRow({ conv, meId, active, onClick }: { conv: LocalConv; meId: string; active: boolean; onClick: () => void }) {
  const isGroup = conv.type === 'GROUP'
  const name = isGroup
    ? (conv.conversationName ?? 'Group')
    : (conv.participants.find(p => p.id !== meId)?.nickname ?? 'Unknown')

  return (
    <button onClick={onClick} className={`dm-item ${active ? 'active' : ''}`}>
      {isGroup
        ? <GroupAvatar conv={conv} meId={meId} size={42} />
        : <Avatar user={conv.participants.find(p => p.id !== meId) ?? { id: '', nickname: '?' }} size={42} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontWeight: conv.unread > 0 ? 700 : 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          <span className="mono" style={{ fontSize: 10, color: conv.unread > 0 ? 'var(--primary)' : 'var(--muted-foreground)', flexShrink: 0, fontWeight: 600 }}>{conv.lastAt}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: conv.unread > 0 ? 'var(--foreground)' : 'var(--muted-foreground)', fontWeight: conv.unread > 0 ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {conv.preview || <span style={{ fontStyle: 'italic' }}>No messages yet</span>}
          </span>
          {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
        </div>
      </div>
    </button>
  )
}

export function DMSidebar({ convs, activeId, setActiveId, filter, setFilter, query, setQuery, onNewChat, onNewGroup, onSignOut, meId, meNickname }: {
  convs: LocalConv[]
  activeId: string | null
  setActiveId: (id: string) => void
  filter: string
  setFilter: (f: string) => void
  query: string
  setQuery: (q: string) => void
  onNewChat: () => void
  onNewGroup: () => void
  onSignOut: () => void
  meId: string
  meNickname: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [plusOpen, setPlusOpen] = useState(false)
  const totalUnread = convs.reduce((s, c) => s + c.unread, 0)

  return (
    <div style={{ background: 'var(--sidebar)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--sidebar-border)', minWidth: 0 }}>
      {/* Brand row */}
      <div style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.04em' }}>Micio</span>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>chat</span>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setPlusOpen(o => !o)}
            style={{ width: 36, height: 36, borderRadius: 12, background: plusOpen ? 'var(--primary)' : 'var(--secondary)', color: plusOpen ? 'white' : 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
          ><Plus size={18} /></button>
          {plusOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setPlusOpen(false)} />
              <div className="animate-slide-up" style={{ position: 'absolute', top: 44, right: 0, minWidth: 220, padding: 6, background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', zIndex: 10 }}>
                <MenuItem icon={<MessageSquare size={16} />} label="New conversation" hint="1-on-1 chat" onClick={() => { setPlusOpen(false); onNewChat() }} />
                <MenuItem icon={<Users size={16} />} label="New group" hint="Multiple people" onClick={() => { setPlusOpen(false); onNewGroup() }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            className="micio-input"
            placeholder="Search conversations…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ paddingLeft: 42, height: 42 }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 4, padding: '0 20px', borderBottom: '1px solid var(--sidebar-border)', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {([['all', 'All'], ['unread', 'Unread'], ['groups', 'Groups']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={`micio-tab ${filter === id ? 'active' : ''}`}>{label}</button>
          ))}
        </div>
        {totalUnread > 0 && <span className="mono" style={{ fontSize: 10, color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}>{totalUnread} new</span>}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        {convs.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
            No conversations match.
          </div>
        )}
        {convs.map(c => (
          <DMRow key={c.id} conv={c} meId={meId} active={c.id === activeId} onClick={() => setActiveId(c.id)} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: 10, borderTop: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <div className="micio-avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
          <div className="micio-avatar-inner" style={{ background: getGrad(meId) }}>
            <span>{getInitials(meNickname || meId)}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            @{meNickname}
          </div>
        </div>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{ width: 34, height: 34, borderRadius: 10, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--secondary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)' }}
          onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)' }}
        ><MoreHorizontal size={16} /></button>
        {menuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setMenuOpen(false)} />
            <div className="animate-slide-up" style={{ position: 'absolute', bottom: 52, right: 10, minWidth: 200, padding: 6, background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', zIndex: 10 }}>
              <MenuItem icon={<ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />} label="Log out" onClick={() => { setMenuOpen(false); onSignOut() }} danger />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
