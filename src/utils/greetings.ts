const GREETINGS: string[] = [
  "Hey there! What's on your mind today?",
  'Ready when you are — ask me anything.',
  "Let's get started. Type a message to begin.",
  'How can I help you today?',
  'Ask away — I\'m listening.',
  'What would you like to talk about?',
  'Start typing below to begin the conversation.',
]

export function getRandomGreeting(): string {
    const randomIndex = Math.floor(Math.random() * GREETINGS.length)
    return GREETINGS[randomIndex]
}