import { useState, useRef, useEffect, useCallback } from 'react'
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

  const queuedMessagesRef = useRef<string[]>([])
  const prevActiveIdRef = useRef<string | null>(null)

  useEffect(() => {
    const prev = prevActiveIdRef.current
    prevActiveIdRef.current = activeId

    if (prev?.startsWith('pending:') && activeId && !activeId.startsWith('pending:')) {
      const queued = queuedMessagesRef.current.splice(0)
      queued.forEach(msg => sendMessage(msg))
    }
  }, [activeId, sendMessage])

  const handleSend = useCallback((text: string) => {
    if (active?.clientState === 'pending') {
      queuedMessagesRef.current.push(text)
    } else {
      sendMessage(text)
    }
  }, [active?.clientState, sendMessage])

  return {
    convs, activeId, setActiveId, filter, setFilter, query, setQuery,
    modal, setModal, closeModal, loading,
    active, filtered,
    meId, meNickname,
    sendMessage: handleSend, startDM, createGroup, handleSignOut,
    createGroupError, creatingGroup, messageError,
  }
}
