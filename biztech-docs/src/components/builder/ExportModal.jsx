'use client'

import { useState } from 'react'

export function ExportModal({ markdoc, title, wordCount, blockCount, onClose, onSubmitPR }) {
  const [copied, setCopied] = useState(false)
  const [showPath, setShowPath] = useState(false)

  const slug = (title || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const filePath = `src/app/docs/${slug}/page.md`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdoc)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for non-HTTPS
      const textarea = document.createElement('textarea')
      textarea.value = markdoc
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([markdoc], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'page.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl dark:bg-slate-800">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Export as Markdoc
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Copy this content and paste it into a <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-700">page.md</code> file.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* instructions */}
        <div className="border-b border-slate-100 px-4 py-3 sm:px-6 dark:border-slate-700/50">
          <button
            onClick={() => setShowPath(!showPath)}
            className="text-sm font-medium text-sky-500 hover:text-sky-600"
          >
            {showPath ? '▾' : '▸'} How to use this
          </button>
          {showPath && (
            <div className="mt-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
              <ol className="list-inside list-decimal space-y-1.5">
                <li>
                  Create a folder: <code className="rounded bg-slate-200 px-1 text-xs dark:bg-slate-700">{filePath.replace('/page.md', '/')}</code>
                </li>
                <li>
                  Create <code className="rounded bg-slate-200 px-1 text-xs dark:bg-slate-700">page.md</code> inside that folder
                </li>
                <li>Paste the Markdoc content below into that file</li>
                <li>
                  Add a navigation entry in <code className="rounded bg-slate-200 px-1 text-xs dark:bg-slate-700">src/lib/navigation.js</code>:
                  <pre className="mt-1 rounded bg-slate-900 p-2 text-xs text-slate-300">
{`{ title: '${title || 'Untitled'}', href: '/docs/${slug}/' }`}
                  </pre>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* markdoc output */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <pre className="max-h-[50vh] overflow-y-auto rounded-xl bg-slate-900 p-4 text-sm leading-relaxed text-slate-300">
            <code>{markdoc}</code>
          </pre>
        </div>

        {/* actions */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-700">
          <div className="hidden items-center gap-3 text-[11px] text-slate-400 sm:flex">
            {wordCount != null && (
              <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
            )}
            {blockCount != null && (
              <>
                <span>·</span>
                <span>{blockCount} block{blockCount !== 1 ? 's' : ''}</span>
              </>
            )}
            <span>·</span>
            <span>{markdoc.length.toLocaleString()} chars</span>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              onClick={handleDownload}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Download page.md
            </button>
            {onSubmitPR && (
              <button
                onClick={() => { onClose(); onSubmitPR(); }}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Submit as PR
              </button>
            )}
            <button
              onClick={handleCopy}
              className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              {copied ? '✓ Copied!' : 'Copy to clipboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
