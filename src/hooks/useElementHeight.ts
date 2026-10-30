import { useState, useRef, useEffect } from 'react'

function useElementHeight<T extends HTMLElement>() {
    const ref = useRef<T>(null)
    const [height, setHeight] = useState(0)

    useEffect(() => {
        const el = ref.current
        if (!el) return
    
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            setHeight(entry.contentRect.height)
          }
        })
    
        observer.observe(el)
        return () => observer.disconnect()
      }, [])

      return [ref, height] as const
}

export default useElementHeight