import { useEffect } from 'react'

function useFavicon(isTyping: boolean) {
    useEffect(() => {
        const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
        if (!link) return

        link.href = isTyping ? '/favicon-typing.png' : '/favicon.png'
    }, [isTyping])
}

export default useFavicon