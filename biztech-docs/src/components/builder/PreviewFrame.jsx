'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'

/**
 * renders children inside an <iframe> so that tailwind responsive
 * breakpoints (sm:, lg:, xl:) respond to the iframe's width rather
 * than the parent viewport (very cool!!!!). this means the preview pane in split
 * view will behave exactly like the real site would at that width.
 *
 * all stylesheets from the parent document are cloned into the
 * iframe so tailwind utilities, typography plugin, prism, and
 * custom fonts all work identically.

 */
export const PreviewFrame = forwardRef(function PreviewFrame(
  { children, className, style, onReady },
  ref,
) {
  const iframeRef = useRef(null)
  const [mountNode, setMountNode] = useState(null)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  // expose the iframe's scrollable element to the parent for scroll sync.
  // we return an object that behaves like a DOM element for scroll purposes:
  // - scrollTop / scrollHeight / clientHeight read from documentElement
  // - addEventListener/removeEventListener proxy to the iframe's window
  useImperativeHandle(
    ref,
    () => ({
      get scrollElement() {
        const doc = iframeRef.current?.contentDocument
        const win = iframeRef.current?.contentWindow
        if (!doc || !win) return null
        return {
          get scrollTop() {
            return doc.documentElement.scrollTop
          },
          set scrollTop(v) {
            doc.documentElement.scrollTop = v
          },
          get scrollHeight() {
            return doc.documentElement.scrollHeight
          },
          get clientHeight() {
            return doc.documentElement.clientHeight
          },
          addEventListener: (type, fn, opts) =>
            win.addEventListener(type, fn, opts),
          removeEventListener: (type, fn) =>
            win.removeEventListener(type, fn),
        }
      },
    }),
    [],
  )

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    function setup() {
      const doc = iframe.contentDocument
      if (!doc) return

      // copy the <html> class list (fonts, antialiased, dark mode, etc.)
      const htmlClasses = document.documentElement.className
      doc.documentElement.className = htmlClasses

      // copy <body> base classes to match root layout
      doc.body.className =
        'flex min-h-full bg-white dark:bg-slate-900'
      doc.body.style.margin = '0'

      // clone all <style> and <link rel="stylesheet"> from parent into iframe <head>
      const parentStyles = document.querySelectorAll(
        'style, link[rel="stylesheet"]',
      )
      parentStyles.forEach((node) => {
        doc.head.appendChild(node.cloneNode(true))
      })

      // create a mount div for the React portal
      let mount = doc.getElementById('preview-root')
      if (!mount) {
        mount = doc.createElement('div')
        mount.id = 'preview-root'
        mount.style.display = 'contents'
        doc.body.appendChild(mount)
      }

      setMountNode(mount)

      // notify the parent that the iframe is ready (for scroll sync etc.)
      if (onReadyRef.current) onReadyRef.current()
    }

    iframe.addEventListener('load', setup)

    return () => {
      iframe.removeEventListener('load', setup)
    }
  }, [])

  // watch for dynamically-injected styles in the parent <head> and
  // mirror them into the iframe (Next.js injects styles at runtime).
  useEffect(() => {
    if (!mountNode) return
    const iframe = iframeRef.current
    if (!iframe?.contentDocument) return
    const iframeHead = iframe.contentDocument.head

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (
            node.nodeName === 'STYLE' ||
            (node.nodeName === 'LINK' && node.rel === 'stylesheet')
          ) {
            iframeHead.appendChild(node.cloneNode(true))
          }
        }
      }
    })

    observer.observe(document.head, { childList: true })
    return () => observer.disconnect()
  }, [mountNode])

  // keep the iframe's <html> dark class in sync with the parent
  useEffect(() => {
    if (!mountNode) return

    const observer = new MutationObserver(() => {
      const iframe = iframeRef.current
      if (!iframe?.contentDocument) return
      iframe.contentDocument.documentElement.className =
        document.documentElement.className
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [mountNode])

  return (
    <>
      <iframe
        ref={iframeRef}
        className={className}
        style={{
          border: 'none',
          width: '100%',
          height: '100%',
          display: 'block',
          ...style,
        }}
        title="Page preview"
        srcDoc="<!doctype html><html><head></head><body></body></html>"
      />
      {mountNode && createPortal(children, mountNode)}
    </>
  )
})
