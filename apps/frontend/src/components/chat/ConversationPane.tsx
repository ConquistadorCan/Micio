import { useState, useEffect, useRef } from 'react'
import { Search, Send } from 'lucide-react'
import { Avatar, GroupAvatar } from '@/components/ui/avatar'
import { formatTime } from '@/components/chat/utils'
import type { LocalConv, LocalMsg } from '@/types/chat'

function IconBtn({ onClick, children, tooltip, size = 38 }: {
  onClick?: () => void; children: React.ReactNode; tooltip?: string; size?: number
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button onClick={onClick} style={{
        width: size, height: size, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--muted-foreground)', background: 'transparent', transition: 'all 0.15s',
      }}
        onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--secondary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)' }}
        onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)' }}
      >{children}</button>
      {tooltip && show && (
        <div style={{
          position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
          marginLeft: 12, padding: '6px 10px', background: 'oklch(0.12 0.01 272)', color: 'white',
          borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 40, pointerEvents: 'none',
        }}>{tooltip}</div>
      )}
    </div>
  )
}

function MessageRow({ msg, meId, conv, mergeAbove }: { msg: LocalMsg; meId: string; conv: LocalConv; mergeAbove: boolean }) {
  const isMe = msg.senderId === meId
  const sender = conv.participants.find(p => p.id === msg.senderId)
  const displayName = isMe ? 'You' : (sender?.nickname ?? 'Unknown')
  const at = msg.localAt ?? formatTime(msg.createdAt)

  return (
    <div className="animate-message-in" style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 10, marginTop: mergeAbove ? 2 : 14 }}>
      <div style={{ width: 36, flexShrink: 0 }}>
        {!mergeAbove && <Avatar user={sender ?? { id: msg.senderId, nickname: '?' }} size={36} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', minWidth: 0 }}>
        {!mergeAbove && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, paddingLeft: 2, paddingRight: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{displayName}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--muted-foreground)', fontWeight: 500 }}>{at}</span>
          </div>
        )}
        <div className={`message-bubble ${isMe ? 'me' : 'them'}`}>{msg.message}</div>
      </div>
    </div>
  )
}

function Composer({ onSend, name, disabled = false }: { onSend: (text: string) => void; name: string; disabled?: boolean }) {
  const [text, setText] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const submit = (e?: React.SyntheticEvent) => {
    e?.preventDefault()
    if (disabled) return
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
    if (taRef.current) taRef.current.style.height = 'auto'
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const el = taRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(140, el.scrollHeight) + 'px' }
  }

  return (
    <div style={{ padding: '12px 24px 20px', flexShrink: 0 }}>
      <form onSubmit={submit} style={{
        background: 'var(--secondary)', border: '1px solid var(--border)',
        borderRadius: 'calc(var(--radius) * 0.8)', padding: '8px 8px 8px 16px',
        display: 'flex', alignItems: 'flex-end', gap: 6,
      }}>
        <textarea
          ref={taRef} value={text} onChange={onInput} onKeyDown={onKey}
          placeholder={disabled ? `Starting chat with ${name}...` : `Message ${name}`} rows={1}
          disabled={disabled}
          style={{ flex: 1, minHeight: 36, maxHeight: 140, resize: 'none', padding: '8px 4px', fontSize: 14.5, lineHeight: 1.5, color: 'var(--foreground)', background: 'transparent' }}
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          style={{
            width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: !disabled && text.trim() ? 'var(--primary)' : 'var(--accent)',
            color: !disabled && text.trim() ? 'white' : 'var(--muted-foreground)',
            boxShadow: !disabled && text.trim() ? 'var(--shadow-glow)' : 'none', transition: 'all 0.15s',
          }}
        ><Send size={17} /></button>
      </form>
      <div style={{ display: 'flex', padding: '8px 4px 0', fontSize: 11, color: 'var(--muted-foreground)' }}>
        <div className="mono" style={{ letterSpacing: '0.05em' }}>
          <kbd style={{ fontFamily: 'var(--font-mono)', background: 'var(--secondary)', padding: '2px 6px', borderRadius: 5, fontSize: 10 }}>↵</kbd> send
          <span style={{ margin: '0 6px' }}>·</span>
          <kbd style={{ fontFamily: 'var(--font-mono)', background: 'var(--secondary)', padding: '2px 6px', borderRadius: 5, fontSize: 10 }}>shift ↵</kbd> new line
        </div>
      </div>
    </div>
  )
}

export function ConversationPane({ conv, meId, onSend, messageError }: {
  conv: LocalConv | null
  meId: string
  onSend: (text: string) => void
  messageError?: string | null
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [conv?.id, conv?.messages.length])

  if (!conv) {
    return (
      <div style={{ background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
        Select a conversation
      </div>
    )
  }

  const isGroup = conv.type === 'GROUP'
  const other = !isGroup ? conv.participants.find(p => p.id !== meId) : null
  const name = isGroup ? (conv.conversationName ?? 'Group') : (other?.nickname ?? 'Unknown')
  const isPending = conv.clientState === 'pending'
  const hasError = conv.clientState === 'error'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--background)', minWidth: 0, minHeight: 0 }}>
      <div style={{ height: 68, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {isGroup
          ? <GroupAvatar conv={conv} meId={meId} size={40} />
          : <Avatar user={other ?? { id: '', nickname: '?' }} size={40} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 1 }}>
            {isGroup ? `${conv.participants.length} members` : `@${other?.nickname ?? ''}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <IconBtn tooltip="Search in chat"><Search size={18} /></IconBtn>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '16px 24px 8px', minHeight: 0 }}>
        {hasError && (
          <div style={{ margin: '16px 0 8px', padding: '12px 14px', borderRadius: 14, background: 'color-mix(in oklab, var(--destructive) 14%, transparent)', color: 'var(--destructive)', fontSize: 13 }}>
            {conv.clientError ?? 'Could not open this conversation.'}
          </div>
        )}
        {conv.messages.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--foreground)', marginBottom: 6 }}>Say hi to {name}</div>
            <div style={{ fontSize: 14 }}>
              {isPending ? 'Your conversation is being prepared.' : 'This is the beginning of your conversation.'}
            </div>
          </div>
        )}
        {conv.messages.map((m, i) => {
          const prev = conv.messages[i - 1]
          const mergeAbove = !!prev && prev.senderId === m.senderId
          return <MessageRow key={m.id} msg={m} meId={meId} conv={conv} mergeAbove={mergeAbove} />
        })}
      </div>

      {messageError && !isPending && !hasError && (
        <div style={{ padding: '0 24px 8px', flexShrink: 0 }}>
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'color-mix(in oklab, var(--destructive) 14%, transparent)', color: 'var(--destructive)', fontSize: 13 }}>
            {messageError}
          </div>
        </div>
      )}

      <Composer onSend={onSend} name={name} disabled={isPending || hasError} />
    </div>
  )
}
