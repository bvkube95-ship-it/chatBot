export interface MessageBox {
  message: string
  sender: "user" | "bot"
  id: string
  isError?: boolean
  isFailed?: boolean
}

export interface ChatSession {
  id: string
  title?: string
  messages: MessageBox[]
}