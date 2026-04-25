import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/services/api'
import { connectSocket, disconnectSocket } from '@/services/socket'
import { formatTime } from '@/components/chat/utils'
import type { LocalConv, LocalMsg } from '@/types/chat'
import type { ConversationPublic, MessagePublic, UserMinimal } from '@micio/shared'
import type { Socket } from 'socket.io-client'

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

  const socketRef = useRef<Socket | null>(null)
  const activeIdRef = useRef<string | null>(null)
  activeIdRef.current = activeId

  const meId = user?.id ?? ''
  const meNickname = user?.nickname ?? ''

  useEffect(() => {
    if (!accessToken) { navigate('/login'); return }
    apiFetch<{ conversations: ConversationPublic[] }>('/api/conversations', 'GET')
      .then(data => {
        const loaded = data.conversations.map(c => ({
          ...c,
          messages: [] as LocalMsg[],
          unread: 0,
          preview: '',
          lastAt: '',
        }))
        setConvs(loaded)
        if (loaded.length > 0) setActiveId(loaded[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

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
        return {
          ...c,
          messages: [...c.messages, localMsg],
          preview: msg.message,
          lastAt: 'now',
          unread: isActive ? 0 : c.unread + 1,
        }
      }))
    })

    return () => { disconnectSocket() }
  }, [accessToken])

  useEffect(() => {
    if (!activeId) return
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
    if (!activeId || !socketRef.current) return
    socketRef.current.emit('message:send', { conversationId: activeId, content: text })
  }, [activeId])

  const startDM = useCallback(async (userId: string) => {
    const existing = convs.find(c => c.type === 'PRIVATE' && c.participants.some(p => p.id === userId))
    if (existing) { setActiveId(existing.id); setModal(null); return }
    try {
      const { conversation } = await apiFetch<{ conversation: ConversationPublic }>('/api/conversations', 'POST', {
        type: 'PRIVATE', participantIds: [userId],
      })
      const newConv: LocalConv = { ...conversation, messages: [], unread: 0, preview: '', lastAt: 'now' }
      setConvs(cs => [newConv, ...cs])
      setActiveId(newConv.id)
      socketRef.current?.emit('conversation:join', newConv.id)
    } catch { }
    setModal(null)
  }, [convs, apiFetch])

  const createGroup = useCallback(async (name: string, memberIds: string[]) => {
    try {
      const { conversation } = await apiFetch<{ conversation: ConversationPublic }>('/api/conversations', 'POST', {
        type: 'GROUP', conversationName: name, participantIds: memberIds,
      })
      const newConv: LocalConv = { ...conversation, messages: [], unread: 0, preview: 'Group created', lastAt: 'now' }
      setConvs(cs => [newConv, ...cs])
      setActiveId(newConv.id)
      socketRef.current?.emit('conversation:join', newConv.id)
    } catch { }
    setModal(null)
  }, [apiFetch])

  const handleSignOut = useCallback(async () => {
    try { await authFetch('/auth/logout', 'POST') } catch { }
    disconnectSocket()
    logout()
    navigate('/login')
  }, [authFetch, logout, navigate])

  const knownUsers = useMemo((): UserMinimal[] => {
    const seen = new Set<string>()
    const users: UserMinimal[] = []
    for (const c of convs) {
      for (const p of c.participants) {
        if (p.id !== meId && !seen.has(p.id)) {
          seen.add(p.id)
          users.push(p)
        }
      }
    }
    return users
  }, [convs, meId])

  const filtered = useMemo(() => {
    let list = convs
    if (filter === 'unread') list = list.filter(c => c.unread > 0)
    if (filter === 'groups') list = list.filter(c => c.type === 'GROUP')
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(c => {
        const name = c.type === 'GROUP'
          ? c.conversationName
          : c.participants.find(p => p.id !== meId)?.nickname
        return name?.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q)
      })
    }
    return list
  }, [convs, filter, query, meId])

  const active = convs.find(c => c.id === activeId) ?? null

  return {
    convs, activeId, setActiveId, filter, setFilter, query, setQuery,
    modal, setModal, loading,
    active, filtered, knownUsers,
    meId, meNickname,
    sendMessage, startDM, createGroup, handleSignOut,
  }
}
