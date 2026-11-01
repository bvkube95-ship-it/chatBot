import { useCallback, useState } from 'react'

const NEW_CHAT_KEY = 'new-chat'

function useDrafts(activeChatId: string | null) {
    const [drafts, setDrafts] = useState<Record<string, string>>({})

    const draftKey = activeChatId ?? NEW_CHAT_KEY
    const draftText = drafts[draftKey] ?? ''

    const setDraftText = useCallback(
        (text: string) => {
            setDrafts((prev) => ({ ...prev, [draftKey]: text}))
        }, [draftKey]
    )

    const clearDraft = useCallback(() => { 
        setDrafts((prev) => {
            const next = { ...prev }
            delete next[draftKey]
            return next
        })
    }, [draftKey])

    return { draftText, setDraftText, clearDraft }
}

export default useDrafts