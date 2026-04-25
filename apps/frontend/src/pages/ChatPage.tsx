import { useChat } from '@/hooks/useChat'
import { DMSidebar } from '@/components/chat/DMSidebar'
import { ConversationPane } from '@/components/chat/ConversationPane'
import { NewChatModal, NewGroupModal } from '@/components/chat/Modals'

export function ChatPage() {
  const chat = useChat()

  if (chat.loading) {
    return (
      <div className="dark" style={{ height: '100vh', background: 'var(--sidebar-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="typing-dots"><span /><span /><span /></span>
      </div>
    )
  }

  return (
    <div
      className="dark animate-fade-in"
      style={{
        height: '100vh', display: 'grid',
        gridTemplateColumns: '340px 1fr',
        background: 'var(--sidebar-deep)', color: 'var(--foreground)', overflow: 'hidden',
      }}
    >
      <DMSidebar
        convs={chat.filtered}
        activeId={chat.activeId}
        setActiveId={chat.setActiveId}
        filter={chat.filter}
        setFilter={chat.setFilter}
        query={chat.query}
        setQuery={chat.setQuery}
        onNewChat={() => chat.setModal('new-chat')}
        onNewGroup={() => chat.setModal('new-group')}
        onSignOut={chat.handleSignOut}
        meId={chat.meId}
        meNickname={chat.meNickname}
      />
      <ConversationPane conv={chat.active} meId={chat.meId} onSend={chat.sendMessage} />

      {chat.modal === 'new-chat' && (
        <NewChatModal onClose={() => chat.setModal(null)} onPick={chat.startDM} knownUsers={chat.knownUsers} />
      )}
      {chat.modal === 'new-group' && (
        <NewGroupModal onClose={() => chat.setModal(null)} onCreate={chat.createGroup} knownUsers={chat.knownUsers} />
      )}
    </div>
  )
}
