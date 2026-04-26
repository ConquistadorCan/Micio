import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ApiError, useApi } from '@/services/api'
import { connectSocket, disconnectSocket } from '@/services/socket'
import { formatTime } from '@/components/chat/utils'
import type { LocalConv, LocalMsg } from '@/types/chat'
import { ConversationTypeSchema } from '@micio/shared'
import type { ConversationPublic, MessagePublic, UserMinimal } from '@micio/shared'
import type { Socket } from 'socket.io-client'

function createOptimisticMessage(params: {
  conversationId: string
  senderId: string
  text: string
}): LocalMsg {
  const now = new Date()
  const clientId = `client:${now.getTime()}:${Math.random().toString(36).slice(2, 8)}`
  return {
    id: clientId,
    clientId,
    clientState: 'pending',
    senderId: params.senderId,
    message: params.text,
    conversationId: params.conversationId,
    createdAt: now,
    localAt: formatTime(now),
  }
}

function reconcileIncomingMessage(messages: LocalMsg[], incoming: LocalMsg, meId: string): LocalMsg[] {
  if (messages.some(message => message.id === incoming.id)) {
    return messages
  }

  if (incoming.senderId === meId) {
    const optimisticIndex = messages.findIndex(message =>
      message.clientState === 'pending' &&
      message.senderId === incoming.senderId &&
      message.message === incoming.message,
    )

    if (optimisticIndex >= 0) {
      return messages.map((message, index) => index === optimisticIndex ? incoming : message)
    }
  }

  return [...messages, incoming]
}

function toLocalConv(conversation: ConversationPublic, existing?: LocalConv): LocalConv {
  return {
    ...conversation,
    messages: existing?.messages ?? [],
    unread: existing?.unread ?? 0,
    preview: existing?.preview ?? '',
    lastAt: existing?.lastAt ?? '',
  }
}

export function useChat() {
  const { accessToken, user, logout } = useAuth()
  const navigate = useNavigate()
  const { apiFetch, authFetch } = useApi()

  const [convs, setConvs] = useState<LocalConv[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<'new-chat' | 'new-group' | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingDm, setPendingDm] = useState<LocalConv | null>(null)
  const [createGroupError, setCreateGroupError] = useState<string | null>(null)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const activeIdRef = useRef<string | null>(null)
  activeIdRef.current = activeId

  const meId = user?.id ?? ''
  const meNickname = user?.nickname ?? ''

  const syncConversations = useCallback((conversations: ConversationPublic[]) => {
    setConvs(current => {
      const existingById = new Map(current.map(conversation => [conversation.id, conversation]))
      return conversations.map(conversation => toLocalConv(conversation, existingById.get(conversation.id)))
    })
  }, [])

  const closeModal = useCallback(() => {
    setModal(null)
    setCreateGroupError(null)
  }, [])

  useEffect(() => {
    if (!accessToken) { navigate('/login'); return }
    apiFetch<{ conversations: ConversationPublic[] }>('/api/conversations', 'GET')
      .then(data => {
        const loaded = data.conversations.map(c => toLocalConv(c))
        setConvs(loaded)
        if (loaded.length > 0) setActiveId(loaded[0].id)
      })
      .finally(() => setLoading(false))
  }, [accessToken, apiFetch, navigate])

  useEffect(() => {
    if (!accessToken) return
    const socket = connectSocket(accessToken)
    socketRef.current = socket

    socket.on('message:new', (msg: MessagePublic) => {
      const at = formatTime(msg.createdAt)
      const localMsg: LocalMsg = { ...msg, localAt: at }
      setConvs(cs => cs.map(c => {
        if (c.id !== msg.conversationId) return c
        const isActive = activeIdRef.current === c.id
        if (isActive) setMessageError(null)
        return {
          ...c,
          messages: reconcileIncomingMessage(c.messages, localMsg, meId),
          preview: msg.message,
          lastAt: 'now',
          unread: isActive ? 0 : c.unread + 1,
        }
      }))
    })

    return () => { disconnectSocket() }
  }, [accessToken, meId])

  useEffect(() => {
    if (!activeId) return
    if (activeId.startsWith('pending:')) return
    setMessageError(null)
    setConvs(cs => cs.map(c => c.id === activeId ? { ...c, unread: 0 } : c))

    apiFetch<{ messages: MessagePublic[] }>(`/api/conversations/${activeId}/messages`, 'GET')
      .then(data => {
        setConvs(cs => cs.map(c => {
          if (c.id !== activeId) return c
          return { ...c, messages: data.messages.map(m => ({ ...m, localAt: formatTime(m.createdAt) })) }
        }))
      })
      .catch(() => {})
  }, [activeId])

  const sendMessage = useCallback((text: string) => {
    if (!activeId) return
    if (!socketRef.current) {
      setMessageError('You are offline right now. Reconnect and try again.')
      return
    }

    const optimisticMessage = createOptimisticMessage({
      conversationId: activeId,
      senderId: meId,
      text,
    })

    setMessageError(null)
    setConvs(cs => cs.map(c => c.id === activeId
      ? {
        ...c,
        messages: [...c.messages, optimisticMessage],
        preview: text,
        lastAt: 'now',
      }
      : c))

    socketRef.current.emit('message:send', { conversationId: activeId, content: text }, (result?: { ok?: boolean; message?: string }) => {
      if (!result?.ok) {
        setMessageError(result?.message ?? 'Could not send message.')
        setConvs(cs => cs.map(c => c.id === activeId
          ? {
            ...c,
            messages: c.messages.map(message => message.clientId === optimisticMessage.clientId
              ? { ...message, clientState: 'error' }
              : message),
          }
          : c))
      }
    })
  }, [activeId, meId])

  const startDM = useCallback(async (selectedUser: UserMinimal) => {
    const existing = convs.find(c => c.type === ConversationTypeSchema.enum.PRIVATE && c.participants.some(p => p.id === selectedUser.id))
    if (existing) {
      setActiveId(existing.id)
      setModal(null)
      return
    }

    const tempId = `pending:${selectedUser.id}`
    const optimisticConv: LocalConv = {
      id: tempId,
      type: ConversationTypeSchema.enum.PRIVATE,
      participants: [{ id: meId, nickname: meNickname }, selectedUser],
      messages: [],
      unread: 0,
      preview: '',
      lastAt: 'now',
      clientState: 'pending',
    }

    setPendingDm(optimisticConv)
    setActiveId(tempId)
    setModal(null)

    try {
      const { conversation } = await apiFetch<{ conversation: ConversationPublic }>('/api/conversations', 'POST', {
        type: ConversationTypeSchema.enum.PRIVATE, participantIds: [selectedUser.id],
      })
      const newConv: LocalConv = { ...conversation, messages: [], unread: 0, preview: '', lastAt: 'now' }
      setPendingDm(current => current?.id === tempId ? null : current)
      setConvs(cs => [newConv, ...cs])
      setActiveId(newConv.id)
      socketRef.current?.emit('conversation:join', newConv.id)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        try {
          const { conversations } = await apiFetch<{ conversations: ConversationPublic[] }>('/api/conversations', 'GET')
          syncConversations(conversations)

          const existingConversation = conversations.find(conversation =>
            conversation.type === ConversationTypeSchema.enum.PRIVATE &&
            conversation.participants.some(participant => participant.id === selectedUser.id),
          )

          if (existingConversation) {
            setPendingDm(current => current?.id === tempId ? null : current)
            setActiveId(existingConversation.id)
            return
          }
        } catch {
          setPendingDm(current => current?.id === tempId
            ? { ...current, clientState: 'error', clientError: 'Conversation exists, but we could not open it right now.' }
            : current)
          return
        }
      }

      setPendingDm(current => current?.id === tempId
        ? { ...current, clientState: 'error', clientError: error instanceof Error ? error.message : 'Could not start conversation.' }
        : current)
    }
  }, [convs, apiFetch, meId, meNickname, syncConversations])

  const createGroup = useCallback(async (name: string, memberIds: string[]) => {
    setCreatingGroup(true)
    setCreateGroupError(null)
    try {
      const { conversation } = await apiFetch<{ conversation: ConversationPublic }>('/api/conversations', 'POST', {
        type: ConversationTypeSchema.enum.GROUP, conversationName: name, participantIds: memberIds,
      })
      const newConv: LocalConv = { ...conversation, messages: [], unread: 0, preview: 'Group created', lastAt: 'now' }
      setConvs(cs => [newConv, ...cs])
      setActiveId(newConv.id)
      socketRef.current?.emit('conversation:join', newConv.id)
      setModal(null)
      setCreateGroupError(null)
    } catch (error) {
      setCreateGroupError(error instanceof Error ? error.message : 'Could not create group.')
    } finally {
      setCreatingGroup(false)
    }
  }, [apiFetch])

  const handleSignOut = useCallback(async () => {
    try { await authFetch('/auth/logout', 'POST') } catch { }
    disconnectSocket()
    logout()
    navigate('/login')
  }, [authFetch, logout, navigate])

  const filtered = useMemo(() => {
    let list = convs
    if (filter === 'unread') list = list.filter(c => c.unread > 0)
    if (filter === 'groups') list = list.filter(c => c.type === ConversationTypeSchema.enum.GROUP)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(c => {
        const name = c.type === ConversationTypeSchema.enum.GROUP
          ? c.conversationName
          : c.participants.find(p => p.id !== meId)?.nickname
        return name?.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q)
      })
    }
    if (pendingDm && !list.some(c => c.id === pendingDm.id) && filter !== 'groups') {
      list = [pendingDm, ...list]
    }
    return list
  }, [convs, filter, query, meId, pendingDm])

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
