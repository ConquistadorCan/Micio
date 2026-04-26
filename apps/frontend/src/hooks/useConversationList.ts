import { useState, useEffect, useMemo, useCallback, Dispatch, SetStateAction } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ApiError, useApi } from '@/services/api'
import { disconnectSocket, getSocket } from '@/services/socket'
import type { LocalConv } from '@/types/chat'
import { ConversationTypeSchema } from '@micio/shared'
import type { ConversationPublic, UserMinimal } from '@micio/shared'

function toLocalConv(conversation: ConversationPublic, existing?: LocalConv): LocalConv {
  return {
    ...conversation,
    messages: existing?.messages ?? [],
    unread: existing?.unread ?? 0,
    preview: existing?.preview ?? '',
    lastAt: existing?.lastAt ?? '',
  }
}

type Params = {
  setActiveId: Dispatch<SetStateAction<string | null>>
}

export function useConversationList({ setActiveId }: Params) {
  const { accessToken, user, logout } = useAuth()
  const navigate = useNavigate()
  const { apiFetch, authFetch } = useApi()

  const [convs, setConvs] = useState<LocalConv[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<'new-chat' | 'new-group' | null>(null)
  const [pendingDm, setPendingDm] = useState<LocalConv | null>(null)
  const [createGroupError, setCreateGroupError] = useState<string | null>(null)
  const [creatingGroup, setCreatingGroup] = useState(false)

  const meId = user?.id ?? ''
  const meNickname = user?.nickname ?? ''

  const syncConversations = useCallback((conversations: ConversationPublic[]) => {
    setConvs(current => {
      const existingById = new Map(current.map(c => [c.id, c]))
      return conversations.map(c => toLocalConv(c, existingById.get(c.id)))
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
        syncConversations(data.conversations)
        setActiveId(current => current ?? data.conversations[0]?.id ?? null)
      })
      .finally(() => setLoading(false))
  }, [accessToken, apiFetch, navigate, setActiveId, syncConversations])

  const startDM = useCallback(async (selectedUser: UserMinimal) => {
    const existing = convs.find(c =>
      c.type === ConversationTypeSchema.enum.PRIVATE &&
      c.participants.some(p => p.id === selectedUser.id)
    )
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
        type: ConversationTypeSchema.enum.PRIVATE,
        participantIds: [selectedUser.id],
      })
      const newConv: LocalConv = { ...conversation, messages: [], unread: 0, preview: '', lastAt: 'now' }
      setPendingDm(current => current?.id === tempId ? null : current)
      setConvs(cs => [newConv, ...cs])
      setActiveId(newConv.id)
      getSocket()?.emit('conversation:join', newConv.id)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        try {
          const { conversations } = await apiFetch<{ conversations: ConversationPublic[] }>('/api/conversations', 'GET')
          syncConversations(conversations)
          const found = conversations.find(c =>
            c.type === ConversationTypeSchema.enum.PRIVATE &&
            c.participants.some(p => p.id === selectedUser.id)
          )
          if (found) {
            setPendingDm(current => current?.id === tempId ? null : current)
            setActiveId(found.id)
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
  }, [convs, apiFetch, meId, meNickname, setActiveId, syncConversations])

  const createGroup = useCallback(async (name: string, memberIds: string[]) => {
    setCreatingGroup(true)
    setCreateGroupError(null)
    try {
      const { conversation } = await apiFetch<{ conversation: ConversationPublic }>('/api/conversations', 'POST', {
        type: ConversationTypeSchema.enum.GROUP,
        conversationName: name,
        participantIds: memberIds,
      })
      const newConv: LocalConv = { ...conversation, messages: [], unread: 0, preview: 'Group created', lastAt: 'now' }
      setConvs(cs => [newConv, ...cs])
      setActiveId(newConv.id)
      getSocket()?.emit('conversation:join', newConv.id)
      setModal(null)
      setCreateGroupError(null)
    } catch (error) {
      setCreateGroupError(error instanceof Error ? error.message : 'Could not create group.')
    } finally {
      setCreatingGroup(false)
    }
  }, [apiFetch, setActiveId])

  const handleSignOut = useCallback(async () => {
    try { await authFetch('/auth/logout', 'POST') } catch {}
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

  return {
    convs, setConvs, loading,
    filter, setFilter,
    query, setQuery,
    modal, setModal, closeModal,
    pendingDm,
    filtered,
    meId, meNickname,
    startDM, createGroup, handleSignOut,
    createGroupError, creatingGroup,
  }
}
