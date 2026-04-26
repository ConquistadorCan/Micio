import { useChat } from '@/hooks/useChat'
import { DMSidebar } from '@/components/chat/DMSidebar'
import { ConversationPane } from '@/components/chat/ConversationPane'
import { NewChatModal, NewGroupModal } from '@/components/chat/Modals'
import { LoadingPage } from './LoadingPage'

export function ChatPage() {
  const chat = useChat()

  if (chat.loading) {
    return (LoadingPage())
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
      <ConversationPane conv={chat.active} meId={chat.meId} onSend={chat.sendMessage} messageError={chat.messageError} />

      {chat.modal === 'new-chat' && (
        <NewChatModal
          onClose={chat.closeModal}
          onPick={chat.startDM}
        />
      )}
      {chat.modal === 'new-group' && (
        <NewGroupModal
          onClose={chat.closeModal}
          onCreate={chat.createGroup}
          error={chat.createGroupError}
          loading={chat.creatingGroup}
        />
      )}
    </div>
  )
}
