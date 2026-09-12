import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { CodeBlockProps } from '../types'
import { IonIcon } from '@ionic/react';
import { copyOutline, checkmark, codeSlashOutline } from 'ionicons/icons';
import './styles/CodeBlock.css'

function CodeBlock({ language, code }: CodeBlockProps) {
  const [ copied, setCopied ] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">
          <IonIcon icon={codeSlashOutline} className="code-slash-icon"/>
          {language || 'text'}</span>
        <button 
          className="code-block-copy-btn" 
          onClick={handleCopy}
          disabled={copied}
        >
          {copied ? (
            <IonIcon
              icon={checkmark}
              className="copy-img"
            />
          ) : (
            <IonIcon
              icon={copyOutline}
              className="copy-img"
            />
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          fontSize: '14px',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default CodeBlock