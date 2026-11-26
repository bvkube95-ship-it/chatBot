export interface User {
    id: string
    email: string
    name: string | null
    avatarUrl: string | null
}

// Returns the current user, or null if nobody is signed in
export async function fetchMe(): Promise<User | null> {
    const res = await fetch('/auth/me', { credentials: 'include' })

    if(res.status === 401) return null
    if(!res.ok) throw new Error('Falied to load session')

    const data = await res.json()
    return data.user
}

export async function sendMagicLink(email: string): Promise<void> {
    const res = await fetch('/auth/send-link', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    })

    if (res.status === 429) {
        throw new Error('Too many attempts. Please try again in a few minutes.')
    }

    if(!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'could not send the link')
    }
}

export async function logoutRequest(): Promise<void> {
    await fetch('/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
    })
}