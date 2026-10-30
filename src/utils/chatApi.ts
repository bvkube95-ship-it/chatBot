export function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError'
}

export async function streamBotReply(
    message: string,
    signal: AbortSignal,
    onText: (text: string) => void
): Promise<void> {
    const res = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
            signal: signal,
          })
    
          if (!res.ok || !res.body) {
            throw new Error('Server error')
          }
    
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let text = ''
    
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
    
            // stream: true keeps multi-byte characters split across chunks intact
            text += decoder.decode(value, { stream: true })
            onText(text)
          }
    
          text += decoder.decode()
          onText(text)
    
          if (!text.trim()) throw new Error('Empty response')
}


