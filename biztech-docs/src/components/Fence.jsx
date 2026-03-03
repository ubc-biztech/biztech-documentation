'use client'

import { Fragment } from 'react'
import { Highlight } from 'prism-react-renderer'

export function Fence({ children, language = 'javascript' }) {
  const codeString = typeof children === 'string' ? children.trimEnd() : '';

  return (
    <Highlight
      code={codeString}
      language={typeof language === 'string' ? language.toLowerCase() : 'javascript'}
      theme={{ plain: {}, styles: [] }}
    >
      {({ className, style, tokens, getTokenProps }) => (
        <pre className={className} style={style}>
          <code>
            {tokens.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {line
                  .filter((token) => !token.empty)
                  .map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                {'\n'}
              </Fragment>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  )
}
