'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getSavedToken,
  saveToken,
  clearToken,
  validateToken,
  submitPageAsPR,
} from '@/lib/builder/github'
import { NavPicker } from '@/components/builder/NavPicker'

/**
 * modal that walks the user through submitting their page as a GitHub PR.
 *
 * Flow:
 *   1. token setup (stored in localStorage)
 *   2. configure: slug, nav title, PR title
 *   3. submit: real-time progress feedback
 *   4. done: link to the PR
 */
export function SubmitPRModal({
  markdoc,
  pageTitle,
  sectionName,
  onClose,
}) {
  // steps: 'token' | 'configure' | 'submitting' | 'done' | 'error'
  const [step, setStep] = useState('token')
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [validating, setValidating] = useState(false)

  // configure step
  const [slug, setSlug] = useState('')
  const [navTitle, setNavTitle] = useState('')
  const [navPlacement, setNavPlacement] = useState(null)
  const [prTitle, setPrTitle] = useState('')
  const [prBody, setPrBody] = useState('')

  // submit step
  const [progress, setProgress] = useState([])
  const [prUrl, setPrUrl] = useState('')
  const [submitError, setSubmitError] = useState('')

  // initialize from saved token & derive slug
  useEffect(() => {
    const saved = getSavedToken()
    if (saved) {
      setToken(saved)
    }

    const derived = (pageTitle || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setSlug(derived)
    setNavTitle(pageTitle || '')
    setPrTitle(`docs: add ${pageTitle || 'new page'}`)
  }, [pageTitle])

  // if we already have a saved + validated token, skip to configure
  useEffect(() => {
    const saved = getSavedToken()
    if (saved) {
      setValidating(true)
      validateToken(saved)
        .then((login) => {
          setUsername(login)
          setToken(saved)
          setStep('configure')
        })
        .catch(() => {
          clearToken()
          setStep('token')
        })
        .finally(() => setValidating(false))
    }
  }, [])

  const handleValidateToken = useCallback(async () => {
    if (!token.trim()) {
      setTokenError('Please enter a token')
      return
    }
    setValidating(true)
    setTokenError('')
    try {
      const login = await validateToken(token.trim())
      setUsername(login)
      saveToken(token.trim())
      setStep('configure')
    } catch (err) {
      setTokenError(err.message || 'Invalid token or no repo access')
    } finally {
      setValidating(false)
    }
  }, [token])

  const handleSubmit = useCallback(async () => {
    setStep('submitting')
    setProgress([])
    setSubmitError('')

    try {
      const result = await submitPageAsPR({
        token,
        markdoc,
        pageTitle,
        slug,
        sectionName,
        navTitle,
        navPlacement,
        prTitle,
        prBody,
        onProgress: (stepId, message) => {
          setProgress((prev) => [...prev, { stepId, message }])
        },
      })
      setPrUrl(result.url)
      setStep('done')
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong')
      setStep('error')
    }
  }, [token, markdoc, pageTitle, slug, sectionName, navTitle, navPlacement, prTitle, prBody])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl dark:bg-slate-800">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Submit as Pull Request
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Push directly to GitHub and open a PR for review.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* === TOKEN STEP === */}
          {step === 'token' && (
            <div className="space-y-4">
              {validating ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Spinner /> Checking saved token...
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      GitHub Personal Access Token
                    </label>
                    <p className="mb-3 text-xs text-slate-500">
                      Needs <code className="rounded bg-slate-100 px-1 dark:bg-slate-700">repo</code> scope.{' '}
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=BizTech%20Docs%20Builder"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-500 hover:text-sky-600"
                      >
                        Create one here ↗
                      </a>
                    </p>
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleValidateToken()}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                    {tokenError && (
                      <p className="mt-2 text-sm text-red-500">{tokenError}</p>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Your token is stored locally in your browser and never sent anywhere except GitHub's API.
                  </p>
                  <button
                    onClick={handleValidateToken}
                    disabled={validating}
                    className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
                  >
                    {validating ? 'Validating...' : 'Connect to GitHub'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* === CONFIGURE STEP === */}
          {step === 'configure' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <span>✓</span>
                <span>
                  Connected as <strong>{username}</strong>
                </span>
                <button
                  onClick={() => {
                    clearToken()
                    setStep('token')
                    setUsername('')
                    setToken('')
                  }}
                  className="ml-auto text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                >
                  Disconnect
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Page slug
                </label>
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700">
                  <span className="px-3 text-xs text-slate-400">docs/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 border-0 bg-transparent px-0 py-2 text-sm outline-none focus:ring-0 dark:text-white"
                    placeholder="my-page"
                  />
                  <span className="px-3 text-xs text-slate-400">/page.md</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Use slashes for nested pages, e.g. <code className="rounded bg-slate-100 px-1 dark:bg-slate-700">deep-dives/my-feature</code>
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Sidebar title
                </label>
                <input
                  type="text"
                  value={navTitle}
                  onChange={(e) => setNavTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Title shown in sidebar"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Navigation placement
                </label>
                <NavPicker
                  navPlacement={navPlacement}
                  onPlacementChange={setNavPlacement}
                  navTitle={navTitle || pageTitle || 'New page'}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  PR title
                </label>
                <input
                  type="text"
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  PR description <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={prBody}
                  onChange={(e) => setPrBody(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Describe what this page covers..."
                />
              </div>

              {/* Preview of what will be created */}
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Will create
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      NEW
                    </span>
                    <code>biztech-docs/src/app/docs/{slug}/page.md</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      MOD
                    </span>
                    <code>biztech-docs/src/lib/navigation.js</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === SUBMITTING STEP === */}
          {step === 'submitting' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Spinner /> Submitting...
              </div>
              {progress.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      i === progress.length - 1
                        ? 'animate-pulse bg-sky-500'
                        : 'bg-green-500'
                    }`}
                  />
                  <span className="text-slate-600 dark:text-slate-400">
                    {p.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* === DONE STEP === */}
          {step === 'done' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl dark:bg-green-900/30">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Pull Request Created!
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Your page has been pushed and a PR is ready for review.
                </p>
              </div>
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-600"
              >
                View on GitHub ↗
              </a>
              {progress.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-slate-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  {p.message}
                </div>
              ))}
            </div>
          )}

          {/* === ERROR STEP === */}
          {step === 'error' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Something went wrong
                </h3>
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {submitError}
                </p>
              </div>
              {progress.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Progress before error
                  </div>
                  {progress.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-slate-400"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      {p.message}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('configure')}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        {step === 'configure' && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!slug.trim()}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Create Pull Request
            </button>
          </div>
        )}

        {/* footer for done step */}
        {step === 'done' && (
          <div className="flex justify-end border-t border-slate-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-sky-500"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
