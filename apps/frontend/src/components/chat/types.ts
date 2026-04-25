import type { ConversationPublic, MessagePublic } from '@micio/shared'

export type LocalMsg = MessagePublic & { localAt?: string }

export type LocalConv = ConversationPublic & {
  messages: LocalMsg[]
  unread: number
  preview: string
  lastAt: string
}
