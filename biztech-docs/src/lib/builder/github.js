/**
 * github api helpers for the Page Builder.
 *
 * all operations use the GitHub REST API to:
 *   1. get the latest commit SHA on the default branch
 *   2. create a new branch
 *   3. commit one or more files to the branch
 *   4. open a pull request
 *
 * requires github personal access token with `repo` scope.
 */

const OWNER = 'ubc-biztech'
const REPO = 'biztech-documentation'
const BASE_BRANCH = 'main'
const API = 'https://api.github.com'

/** localStorage key for persisting the token */
const TOKEN_KEY = 'biztech-builder-gh-token'

export function getSavedToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/** shared fetch wrapper that adds auth headers and error handling */
async function ghFetch(path, token, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.headers || {}),
    },
  })

  if (!res.ok) {
    let msg = `GitHub API error: ${res.status}`
    try {
      const body = await res.json()
      msg = body.message || msg
    } catch {}
    throw new Error(msg)
  }

  return res.json()
}

/**
 * validates the token by trying to fetch the repo.
 * returns the authenticated user's login or throws.
 */
export async function validateToken(token) {
  const user = await ghFetch('/user', token)
  // Also verify repo access
  await ghFetch(`/repos/${OWNER}/${REPO}`, token)
  return user.login
}

/**
 * get the SHA of the latest commit on the default branch.
 */
async function getBaseSha(token) {
  const ref = await ghFetch(
    `/repos/${OWNER}/${REPO}/git/ref/heads/${BASE_BRANCH}`,
    token,
  )
  return ref.object.sha
}

/**
 * create a new branch from the default branch.
 */
async function createBranch(token, branchName, sha) {
  return ghFetch(`/repos/${OWNER}/${REPO}/git/refs`, token, {
    method: 'POST',
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha,
    }),
  })
}

/**
 * create or update a file on a branch.
 */
async function commitFile(token, branch, path, content, message) {
  return ghFetch(`/repos/${OWNER}/${REPO}/contents/${path}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch,
    }),
  })
}

/**
 * get the current content of a file (returns { content, sha } or null).
 */
async function getFileContent(token, branch, path) {
  try {
    const data = await ghFetch(
      `/repos/${OWNER}/${REPO}/contents/${path}?ref=${branch}`,
      token,
    )
    const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))
    return { content: decoded, sha: data.sha }
  } catch {
    return null
  }
}

/**
 * update an existing file on a branch (requires the file's SHA).
 */
async function updateFile(token, branch, path, content, message, fileSha) {
  return ghFetch(`/repos/${OWNER}/${REPO}/contents/${path}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch,
      sha: fileSha,
    }),
  })
}

/**
 * open a pull request from branchName into the default branch.
 */
async function openPR(token, branchName, title, body) {
  return ghFetch(`/repos/${OWNER}/${REPO}/pulls`, token, {
    method: 'POST',
    body: JSON.stringify({
      title,
      body,
      head: branchName,
      base: BASE_BRANCH,
    }),
  })
}

/**
 * generates a navigation entry string that can be inserted into navigation.js.
 */
function buildNavEntry(title, href) {
  return `      { title: '${title.replace(/'/g, "\\'")}', href: '${href}' },`
}

/**
 * build a brand-new section block for navigation.js.
 */
function buildNewSection(sectionTitle, pageTitle, slug) {
  return [
    '  {',
    `    title: '${sectionTitle.replace(/'/g, "\\'\'")}',`,
    '    links: [',
    `      {`,
    `        title: '${pageTitle.replace(/'/g, "\\'\'")}',`,
    `        href: '/docs/${slug}',`,
    `      },`,
    '    ],',
    '  },',
  ].join('\n')
}

/**
 * adds a navigation link to navigation.js using index-based placement.
 *
 * navPlacement shape:
 *   { type: 'existing', sectionIndex: number, positionIndex: number }
 *   { type: 'new-section', sectionIndex: number, newSectionTitle: string }
 *
 * for 'existing': inserts the link at positionIndex within the section's links array.
 * for 'new-section': inserts a brand-new section at sectionIndex.
 *
 * returns the updated file content, or null if insertion failed.
 */
function addNavEntry(navContent, pageTitle, slug, navPlacement) {
  if (!navPlacement) {
    // fallback: append to last section
    const entry = buildNavEntry(pageTitle, `/docs/${slug}`)
    const lastLinksClose = navContent.lastIndexOf('    ],')
    if (lastLinksClose !== -1) {
      return (
        navContent.slice(0, lastLinksClose) +
        entry +
        '\n' +
        navContent.slice(lastLinksClose)
      )
    }
    return null
  }

  if (navPlacement.type === 'new-section') {
    // insert a whole new section object at the given sectionIndex
    const newSection = buildNewSection(
      navPlacement.newSectionTitle,
      pageTitle,
      slug,
    )

    // find all section boundaries (each `  {` that starts a section object)
    const sectionStarts = []
    const sectionPattern = /^  \{$/gm
    let m
    while ((m = sectionPattern.exec(navContent)) !== null) {
      sectionStarts.push(m.index)
    }

    let insertPos
    if (navPlacement.sectionIndex >= sectionStarts.length) {
      // insert before the closing `]` of the top-level array
      const arrayClose = navContent.lastIndexOf(']')
      insertPos = arrayClose
      return (
        navContent.slice(0, insertPos) +
        newSection +
        '\n' +
        navContent.slice(insertPos)
      )
    } else {
      insertPos = sectionStarts[navPlacement.sectionIndex]
      return (
        navContent.slice(0, insertPos) +
        newSection +
        '\n' +
        navContent.slice(insertPos)
      )
    }
  }

  if (navPlacement.type === 'existing') {
    const entry = buildNavEntry(pageTitle, `/docs/${slug}`)

    // walk through sections to find the nth one
    // each section's links array has entries like `      { title: '...', href: '...' },`
    // or multi-line entries with `      {` ... `      },`
    const sectionTitlePattern = /title:\s*'[^']+',\s*\n\s*links:\s*\[/g
    let sectionCount = -1
    let targetLinksStart = -1
    let sm

    while ((sm = sectionTitlePattern.exec(navContent)) !== null) {
      sectionCount++
      if (sectionCount === navPlacement.sectionIndex) {
        targetLinksStart = sm.index + sm[0].length
        break
      }
    }

    if (targetLinksStart === -1) return null

    // find the closing `    ],` for this section's links array
    const linksClose = navContent.indexOf('    ],', targetLinksStart)
    if (linksClose === -1) return null

    // extract the links region and count link entries to find positionIndex
    const linksRegion = navContent.slice(targetLinksStart, linksClose)

    // count link objects: each ends with `},` (with possible whitespace)
    const linkEnds = []
    const linkEndPattern = /\},?\s*$/gm
    let le
    // more reliable: find each `      },` or closing of a link object
    const closingBrace = /^\s{6}\},?/gm
    while ((le = closingBrace.exec(linksRegion)) !== null) {
      linkEnds.push(targetLinksStart + le.index + le[0].length)
    }

    const posIdx = navPlacement.positionIndex ?? linkEnds.length

    if (posIdx === 0) {
      // insert right after `links: [`
      return (
        navContent.slice(0, targetLinksStart) +
        '\n' +
        entry +
        navContent.slice(targetLinksStart)
      )
    } else if (posIdx <= linkEnds.length) {
      // insert after the posIdx-th link
      const insertAfter = linkEnds[posIdx - 1]
      return (
        navContent.slice(0, insertAfter) +
        '\n' +
        entry +
        navContent.slice(insertAfter)
      )
    } else {
      // append at end of links array
      return (
        navContent.slice(0, linksClose) +
        entry +
        '\n' +
        navContent.slice(linksClose)
      )
    }
  }

  return null
}

/**
 * the main function: creates a branch, commits page.md + updated navigation.js,
 * and opens a PR.
 *
 * onProgress is called with status messages: (step, message) => void
 *
 * returns the PR URL on success.
 */
export async function submitPageAsPR({
  token,
  markdoc,
  pageTitle,
  slug,
  sectionName,
  navTitle,
  navPlacement,
  prTitle,
  prBody,
  onProgress,
}) {
  const progress = onProgress || (() => {})

  // 1. get base SHA
  progress('branch', 'Getting latest commit...')
  const baseSha = await getBaseSha(token)

  // 2. create branch
  const branchName = `docs/${slug}-${Date.now()}`
  progress('branch', `Creating branch: ${branchName}`)
  await createBranch(token, branchName, baseSha)

  // 3. commit the page.md file
  const pagePath = `biztech-docs/src/app/docs/${slug}/page.md`
  progress('commit', `Committing ${pagePath}...`)
  await commitFile(
    token,
    branchName,
    pagePath,
    markdoc,
    `docs: add ${pageTitle || slug} page`,
  )

  // 4. try to update navigation.js with a new entry
  const navPath = 'biztech-docs/src/lib/navigation.js'
  progress('nav', 'Updating navigation...')
  try {
    const navFile = await getFileContent(token, branchName, navPath)
    if (navFile) {
      const updatedNav = addNavEntry(
        navFile.content,
        navTitle || pageTitle || slug,
        slug,
        navPlacement,
      )
      if (updatedNav) {
        await updateFile(
          token,
          branchName,
          navPath,
          updatedNav,
          `docs: add ${pageTitle || slug} to navigation`,
          navFile.sha,
        )
        progress('nav', 'Navigation updated!')
      } else {
        progress('nav', 'Could not auto-update navigation (you can add it manually in the PR)')
      }
    }
  } catch (err) {
    progress('nav', `Navigation update skipped: ${err.message}`)
  }

  // 5. open PR
  progress('pr', 'Opening pull request...')
  const body =
    prBody ||
    [
      `## New Documentation Page: ${pageTitle}`,
      '',
      `Adds \`docs/${slug}/page.md\` to the documentation site.`,
      '',
      'Created with the BizTech Page Builder.',
    ].join('\n')

  const pr = await openPR(
    token,
    branchName,
    prTitle || `docs: add ${pageTitle || slug}`,
    body,
  )

  progress('done', 'Pull request created!')

  return {
    url: pr.html_url,
    number: pr.number,
    branch: branchName,
  }
}
