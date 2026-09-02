import React from 'react'
import type { MessageBox, ChatInputProps, ChatMessagesProps } from './types'
import user from './assets/user.png'
import robot from './assets/robot.png'

function ChatInput({ chatMessages, setChatMessages }: ChatInputProps) {
  const [inputText, setInputText] = React.useState('')

  function saveTextInput(event: React.ChangeEvent<HTMLInputElement>) {
    setInputText(event.target.value)
  }

  function sendMessage() {
    setChatMessages([
      ...chatMessages,
      {
        message: inputText,
        sender: 'user',
        id: crypto.randomUUID()
      }
    ])

    setInputText('')
  }

  return (
    <>
      <input 
        placeholder="Send a message to Chatbot"
        size={30}
        value={inputText} 
        onChange={saveTextInput}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage()
          }
        }}
        />
      <button 
        onClick={sendMessage}
      >Send</button>
    </>
  )
}

function ChatMessage({ message, sender }: MessageBox) {
  return (
    <div>
      {sender === 'robot' && <img src={robot} width={50} />}
      {message}
      {sender === 'user' && <img src={user} width={50} />}
    </div>
  )
}

function ChatMessages({ chatMessages }: ChatMessagesProps) {
  return (
    <>
      {chatMessages.map(({ message, sender, id }) => (
        <ChatMessage
          message={message}
          sender={sender}
          id={id}
        />
      ))}
    </>
  )
}

function App() {
  const [chatMessages, setChatMessages] = React.useState<MessageBox[]>([
    {
      message: 'hello chatbot',
      sender: 'user',
      id: 'id1'
    },
    {
      message: 'Hello! How can I help you?',
      sender: 'robot',
      id: 'id2'
    },
    {
      message: 'can you get me todays date?',
      sender: 'user',
      id: 'id3'
    },
    {
      message: 'Today is September 27',
      sender: 'robot',
      id: 'id4'
    }
  ])

  return (
    <>
      <ChatInput 
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
      />
      <ChatMessages 
        chatMessages={chatMessages}
      />
    </>
  )
}

export default App