import { useState, useCallback, useEffect } from 'react'
import { fetchMe, logoutRequest, type User } from '../utils/authApi'

function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Ask the server who we are once, when the app loads
    useEffect(() => {
        let cancelled = false

        fetchMe()
            .then((u) => {
                if(!cancelled) setUser(u)
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    const logout = useCallback(async () => {
        await logoutRequest().catch(() => {})
        setUser(null)
    }, [])

    return {user, isLoading, logout}
}

export default useAuth