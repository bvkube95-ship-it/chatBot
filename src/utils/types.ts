export interface MessageBox {
  message: string
  sender: "user" | "bot"
  id: string
}