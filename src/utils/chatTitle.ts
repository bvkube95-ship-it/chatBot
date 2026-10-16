export const FAILED_TITLE = 'No response'

export function fallbackTitle(message: string): string {
    const text = message.trim().replace(/\s+/g, ' ')
    return text.length > 50 
        ? text.slice(0, 50).trimEnd() + '…' 
        : text
}

export async function requestChatTitle(message: string): Promise<string> {
    try {
        const res = await fetch('/api/title', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        })

        if (!res.ok) return fallbackTitle(message)

        const { title } = await res.json()
        return typeof title === 'string' && title.trim()
            ? title.trim()
            : fallbackTitle(message)
    } catch (error) {
        console.error('Error fetching chat title:', error)
        return fallbackTitle(message)
    }
}