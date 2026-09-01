export interface MessageBox {
  message: string
  sender: "user" | "robot"
  id: string
}

export type ChatInputProps = {
  chatMessages: MessageBox[]
  setChatMessages: React.Dispatch<React.SetStateAction<MessageBox[]>>
}