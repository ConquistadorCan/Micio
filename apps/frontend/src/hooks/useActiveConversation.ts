import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/services/api'
import { connectSocket, disconnectSocket } from '@/services/socket'
import { formatTime } from '@/components/chat/utils'
import type { LocalConv, LocalMsg } from '@/types/chat'
import type { ConversationPublic, MessagePublic } from '@micio/shared'
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
  if (messages.some(m => m.id === incoming.id)) return messages

  if (incoming.senderId === meId) {
    const optimisticIndex = messages.findIndex(m =>
      m.clientState === 'pending' &&
      m.senderId === incoming.senderId &&
      m.message === incoming.message
    )
    if (optimisticIndex >= 0) {
      return messages.map((m, i) => i === optimisticIndex ? incoming : m)
    }
  }

  return [...messages, incoming]
}

function mergeFetchedMessages(existing: LocalMsg[], fetched: MessagePublic[], meId: string): LocalMsg[] {
  return fetched
    .map(msg => ({ ...msg, localAt: formatTime(msg.createdAt) }))
    .reduce((msgs, msg) => reconcileIncomingMessage(msgs, msg, meId), existing)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

type Params = {
  activeId: string | null
  meId: string
  setConvs: Dispatch<SetStateAction<LocalConv[]>>
}

export function useActiveConversation({ activeId, meId, setConvs }: Params) {
  const { accessToken } = useAuth()
  const { apiFetch } = useApi()

  const [messageError, setMessageError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const activeIdRef = useRef<string | null>(null)
  const messageRequestIdRef = useRef(0)
  activeIdRef.current = activeId

  useEffect(() => {
    if (!accessToken) return
    const socket = connectSocket(accessToken)
    socketRef.current = socket

    socket.on('message:new', (msg: MessagePublic) => {
      const localMsg: LocalMsg = { ...msg, localAt: formatTime(msg.createdAt) }
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

    socket.on('conversation:new', (conv: import('@micio/shared').ConversationPublic) => {
      socket.emit('conversation:join', conv.id)
      setConvs(cs => {
        if (cs.some(c => c.id === conv.id)) return cs
        return [{ ...conv, messages: [], unread: 1, preview: '', lastAt: 'now' }, ...cs]
      })
    })

    return () => {
      socket.off('message:new')
      socket.off('conversation:new')
      disconnectSocket()
    }
  }, [accessToken, meId, setConvs])

  useEffect(() => {
    if (!activeId || activeId.startsWith('pending:')) return
    const requestId = ++messageRequestIdRef.current
    setMessageError(null)
    setConvs(cs => cs.map(c => c.id === activeId ? { ...c, unread: 0 } : c))

    apiFetch<{ messages: MessagePublic[] }>(`/api/conversations/${activeId}/messages`, 'GET')
      .then(data => {
        setConvs(cs => cs.map(c => {
          if (requestId !== messageRequestIdRef.current) return c
          if (c.id !== activeId) return c
          return { ...c, messages: mergeFetchedMessages(c.messages, data.messages, meId) }
        }))
      })
      .catch(() => {})
  }, [activeId, apiFetch, meId, setConvs])

  const sendMessage = useCallback((text: string) => {
    if (!activeId) return
    if (!socketRef.current) {
      setMessageError('You are offline right now. Reconnect and try again.')
      return
    }

    const optimisticMessage = createOptimisticMessage({ conversationId: activeId, senderId: meId, text })

    setMessageError(null)
    setConvs(cs => cs.map(c => c.id === activeId
      ? { ...c, messages: [...c.messages, optimisticMessage], preview: text, lastAt: 'now' }
      : c))

    socketRef.current.emit('message:send', { conversationId: activeId, content: text }, (result?: { ok?: boolean; message?: string }) => {
      if (!result?.ok) {
        setMessageError(result?.message ?? 'Could not send message.')
        setConvs(cs => cs.map(c => c.id === activeId
          ? {
            ...c,
            messages: c.messages.map(m => m.clientId === optimisticMessage.clientId
              ? { ...m, clientState: 'error' }
              : m),
          }
          : c))
      }
    })
  }, [activeId, meId, setConvs])

  return { messageError, sendMessage }
}
