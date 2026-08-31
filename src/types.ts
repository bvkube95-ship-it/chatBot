export interface MessageBox {
  message: string
  sender: "user" | "robot"
  id: string
}