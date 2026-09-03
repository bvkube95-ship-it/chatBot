export interface MessageBox {
  message: string
  sender: "user" | "bot"
  id: string
}

export interface ChatMessagesProps {
  chatMessages: MessageBox[]
  isBotTyping: boolean
}

export interface ChatInputProps {
  chatMessages: MessageBox[]
  setChatMessages: React.Dispatch<React.SetStateAction<MessageBox[]>>
  isBotTyping: boolean
  setIsBotTyping: React.Dispatch<React.SetStateAction<boolean>>
}