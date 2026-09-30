export interface MessageBox {
  message: string
  sender: "user" | "bot"
  id: string
}

export interface ChatSession {
  id: string
  title: string
  messages: MessageBox[]
}