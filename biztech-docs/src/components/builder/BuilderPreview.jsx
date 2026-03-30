'use client'

import Link from 'next/link'
import clsx from 'clsx'

import { Callout } from '@/components/Callout'
import { Fence } from '@/components/Fence'
import { Icon } from '@/components/Icon'
import { Prose } from '@/components/Prose'
import { Navigation } from '@/components/Navigation'
import { ThemeSelector } from '@/components/ThemeSelector'
import { Search } from '@/components/Search'

function GitHubIcon(props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z" />
    </svg>
  )
}

/**
 * fake site header that mimics the real stuff
 */
function PreviewHeader() {
  return (
    <header className="sticky top-0 z-50 flex flex-none flex-wrap items-center justify-between bg-white px-4 py-5 shadow-md shadow-slate-900/5 transition duration-500 dark:bg-slate-900/95 dark:shadow-none dark:backdrop-blur sm:px-6 lg:px-8">
      <div className="mr-6 flex lg:hidden" />
      <div className="relative flex flex-grow basis-0 items-center" />
      <div className="-my-5 mr-6 sm:mr-8 md:mr-0">
        <div className="pointer-events-none opacity-60">
          <Search />
        </div>
      </div>
      <div className="relative flex basis-0 items-center justify-end gap-6 sm:gap-8 md:flex-grow">
        <span className="hidden text-sm font-medium text-sky-500 sm:block">
          Page Builder
        </span>
        <div className="pointer-events-none opacity-60">
          <ThemeSelector className="relative z-10" />
        </div>
        <Link href="https://github.com/ubc-biztech/bt-web-v2" className="group" aria-label="GitHub">
          <GitHubIcon className="h-6 w-6 fill-slate-400 group-hover:fill-slate-500 dark:group-hover:fill-slate-300" />
        </Link>
      </div>
    </header>
  )
}

/**
 * generates a fake table-of-contents from the builder blocks,
 */
function PreviewTableOfContents({ blocks }) {
  const headings = blocks.filter(
    (b) => (b.type === 'heading2' || b.type === 'heading3') && b.content.trim(),
  )
  if (headings.length === 0) return null

  return (
    <nav aria-label="Table of contents" className="w-56">
      <h2 className="font-display text-sm font-medium text-slate-900 dark:text-white">
        On this page
      </h2>
      <ol role="list" className="mt-4 space-y-3 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={clsx(h.type === 'heading3' && 'pl-4')}>
            <span className="text-slate-500 dark:text-slate-400">
              {h.content}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  )
}


export function BuilderPreview({ title, blocks, section }) {
  return (
    <div className="flex w-full flex-col bg-white dark:bg-slate-900">
      <PreviewHeader />

      <div className="relative mx-auto flex w-full max-w-8xl flex-auto justify-center sm:px-2 lg:px-8 xl:px-12">
        <div className="hidden lg:relative lg:block lg:flex-none">
          <div className="absolute inset-y-0 right-0 w-[50vw] bg-slate-50 dark:hidden" />
          <div className="absolute bottom-0 right-0 top-16 hidden h-12 w-px bg-gradient-to-t from-slate-800 dark:block" />
          <div className="absolute bottom-0 right-0 top-28 hidden w-px bg-slate-800 dark:block" />
          <div className="sticky top-[4.75rem] -ml-0.5 h-[calc(100vh-4.75rem)] w-64 overflow-y-auto overflow-x-hidden py-16 pl-0.5 pr-8 xl:w-72 xl:pr-16">
            <Navigation />
          </div>
        </div>

        <div className="min-w-0 max-w-2xl flex-auto px-4 py-16 lg:max-w-none lg:pl-8 lg:pr-0 xl:px-16">
          <article>
            {title && (
              <header className="mb-9 space-y-1">
                <p className="font-display text-sm font-medium text-sky-500">
                  {section || 'Preview'}
                </p>
                <h1 className="font-display text-3xl tracking-tight text-slate-900 dark:text-white">
                  {title}
                </h1>
              </header>
            )}

            <Prose>
              {blocks.map((block) => (
                <PreviewBlock key={block.id} block={block} />
              ))}
            </Prose>
          </article>
        </div>

        <div className="hidden xl:sticky xl:top-[4.75rem] xl:-mr-6 xl:block xl:h-[calc(100vh-4.75rem)] xl:flex-none xl:overflow-y-auto xl:py-16 xl:pr-6">
          <PreviewTableOfContents blocks={blocks} />
        </div>
      </div>
    </div>
  )
}

function PreviewBlock({ block }) {
  switch (block.type) {
    case 'leadParagraph':
      if (!block.content.trim()) return null
      return (
        <p className="lead">
          {renderInlineMarkdown(block.content)}
        </p>
      )

    case 'paragraph':
      if (!block.content.trim()) return null
      return <p>{renderInlineMarkdown(block.content)}</p>

    case 'heading2':
      return <h2>{block.content}</h2>

    case 'heading3':
      return <h3>{block.content}</h3>

    case 'heading4':
      return <h4>{block.content}</h4>

    case 'bulletList': {
      const items = block.content.split('\n').filter(Boolean)
      if (items.length === 0) return null
      return (
        <ul>
          {items.map((item, i) => (
            <li key={i}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      )
    }

    case 'numberedList': {
      const items = block.content.split('\n').filter(Boolean)
      if (items.length === 0) return null
      return (
        <ol>
          {items.map((item, i) => (
            <li key={i}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      )
    }

    case 'code': {
      const language = block.props.language || 'javascript'
      return <Fence language={language}>{block.content}</Fence>
    }

    case 'callout': {
      return (
        <Callout
          type={block.props.type || 'note'}
          title={block.props.title || ''}
        >
          <p>{renderInlineMarkdown(block.content)}</p>
        </Callout>
      )
    }

    case 'table': {
      const { headers = [], rows = [] } = block.props
      if (headers.length === 0) return null
      return (
        <table>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} scope="col">
                  {renderInlineMarkdown(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => (
                  <td key={ci}>{renderInlineMarkdown(row[ci] || '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    case 'quickLinks': {
      const { links = [] } = block.props
      if (links.length === 0) return null
      return (
        <div className="not-prose my-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {links.map((link, i) => (
            <div
              key={i}
              className="group relative rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <div className="absolute -inset-px rounded-xl border-2 border-transparent opacity-0 [background:linear-gradient(var(--quick-links-hover-bg,theme(colors.sky.50)),var(--quick-links-hover-bg,theme(colors.sky.50)))_padding-box,linear-gradient(to_top,theme(colors.indigo.400),theme(colors.cyan.400),theme(colors.sky.500))_border-box] group-hover:opacity-100 dark:[--quick-links-hover-bg:theme(colors.slate.800)]" />
              <div className="relative overflow-hidden rounded-xl p-6">
                <Icon icon={link.icon || 'installation'} className="h-8 w-8" />
                <h2 className="mt-4 font-display text-base text-slate-900 dark:text-white">
                  <Link href={link.href || '#'}>
                    <span className="absolute -inset-px rounded-xl" />
                    {link.title || 'Untitled'}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-400">
                  {link.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )
    }

    case 'divider':
      return <hr />

    case 'image': {
      if (!block.props.src) return null
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.props.src} alt={block.props.alt || ''} />
          {block.props.caption && (
            <figcaption>{block.props.caption}</figcaption>
          )}
        </figure>
      )
    }

    default:
      if (block.content) return <p>{block.content}</p>
      return null
  }
}

function renderInlineMarkdown(text) {
  if (!text) return text

  const TOKEN_RE =
    /\*\*(.+?)\*\*|_(.+?)_|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g

  const parts = []
  let lastIndex = 0
  let key = 0
  let match

  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[1] !== undefined) {
      // bold: **text**
      parts.push(<strong key={key++}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      // italic: _text_
      parts.push(<em key={key++}>{match[2]}</em>)
    } else if (match[3] !== undefined) {
      // italic: *text*
      parts.push(<em key={key++}>{match[3]}</em>)
    } else if (match[4] !== undefined) {
      // inline code: `text`
      parts.push(<code key={key++}>{match[4]}</code>)
    } else if (match[5] !== undefined && match[6] !== undefined) {
      // link: [text](url)
      parts.push(
        <a key={key++} href={match[6]}>
          {match[5]}
        </a>,
      )
    }

    lastIndex = match.index + match[0].length
  }

  // push remaining plain text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  if (parts.length === 0) return text
  if (parts.length === 1 && typeof parts[0] === 'string') return parts[0]
  return <>{parts}</>
}
