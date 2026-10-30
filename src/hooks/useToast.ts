import { useCallback, useState, useEffect } from 'react'

interface ToastState {
    id: number
    message: string
}

interface UseToastOptions {
    hideWhen: boolean
    resetOn: unknown
}

function useToast({ hideWhen, resetOn }: UseToastOptions) {
    const [toast, setToast] = useState<ToastState | null>(null)

    const showToast = useCallback((message: string) => {
        setToast((prev) => prev ?? { id: Date.now(), message })
    }, [])

    const hideToast = useCallback(() => setToast(null), [])

    useEffect(() => {
        if (hideWhen) setToast(null)
    }, [hideWhen])

    useEffect(() => {
        setToast(null)
    }, [resetOn])

    return { toast, showToast, hideToast }
}

export default useToast