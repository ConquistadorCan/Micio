import type { ConversationPublic, MessagePublic } from '@micio/shared'

export type LocalMsg = MessagePublic & {
  localAt?: string
  clientId?: string
  clientState?: 'pending' | 'error'
}

export type LocalConv = ConversationPublic & {
  messages: LocalMsg[]
  unread: number
  preview: string
  lastAt: string
  clientState?: 'pending' | 'error'
  clientError?: string
}
