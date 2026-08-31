import { useState } from 'react'
import type { MessageBox } from './types'
import user from './assets/user.png'
import robot from './assets/robot.png'

function ChatInput() {
  return (
    <>
      <input placeholder="Send a message to Chatbot" size={30} />
      <button>Send</button>
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

function ChatMessages() {
  const chatMessages: MessageBox[] = [
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
  ]

  return (
    <>
      {chatMessages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message.message}
          sender={message.sender}
          id={message.id}
        />
      ))}
    </>
  )
}

function App() {
  return (
    <>
      <ChatInput />
      <ChatMessages />
    </>
  )
}

export default App