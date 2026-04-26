import { useState } from 'react'
import { useConversationList } from './useConversationList'
import { useActiveConversation } from './useActiveConversation'

export function useChat() {
  const [activeId, setActiveId] = useState<string | null>(null)

  const {
    convs, setConvs, loading,
    filter, setFilter,
    query, setQuery,
    modal, setModal, closeModal,
    pendingDm,
    filtered,
    meId, meNickname,
    startDM, createGroup, handleSignOut,
    createGroupError, creatingGroup,
  } = useConversationList({ setActiveId })

  const { messageError, sendMessage } = useActiveConversation({ activeId, meId, setConvs })

  const active = (pendingDm && pendingDm.id === activeId)
    ? pendingDm
    : convs.find(c => c.id === activeId) ?? null

  return {
    convs, activeId, setActiveId, filter, setFilter, query, setQuery,
    modal, setModal, closeModal, loading,
    active, filtered,
    meId, meNickname,
    sendMessage, startDM, createGroup, handleSignOut,
    createGroupError, creatingGroup, messageError,
  }
}
