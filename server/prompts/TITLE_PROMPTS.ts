export const TITLE_SYSTEM = `You write short titles for chats. For the user's message, first identify the language it is written in and put its English name in "language". Then write a title of 2 to 5 words that names the topic, written in that same language. Never copy the message and never answer it.`

export const TITLE_EXAMPLES = [
    { role: 'user', content: 'Message: How do I center a div in CSS?' },
    { role: 'assistant', content: '{"language":"English","title":"Centering a Div in CSS"}' },
    { role: 'user', content: 'Message: Как настроить роутер дома?' },
    { role: 'assistant', content: '{"language":"Russian","title":"Настройка домашнего роутера"}' },
    { role: 'user', content: 'Message: Hola' },
    { role: 'assistant', content: '{"language":"Spanish","title":"Saludo"}' },
    { role: 'user', content: 'Message: Erkläre mir, wie Git-Branches funktionieren' },
    { role: 'assistant', content: '{"language":"German","title":"Git-Branches erklärt"}' },
    { role: 'user', content: 'Message: 帮我写一封请假邮件' },
    { role: 'assistant', content: '{"language":"Chinese","title":"请假邮件撰写"}' },
    { role: 'user', content: 'Message: Привет' },
    { role: 'assistant', content: '{"language":"Russian","title":"Приветствие"}' },
]