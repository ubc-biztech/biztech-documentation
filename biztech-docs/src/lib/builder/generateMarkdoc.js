/**
 * converts the builder's block array into valid markdoc source text
 * that can be dropped into a `page.md` file and rendered by the site.
 */
export function generateMarkdoc(meta, blocks) {
  const lines = []
  const title = meta.title || 'Untitled'
  const description = meta.description || ''

  // frontmatter — matches the exact format used in existing page.md files
  lines.push('---')
  lines.push(`title: ${yamlString(title)}`)
  lines.push('nextjs:')
  lines.push('  metadata:')
  lines.push(`    title: ${yamlString(title)}`)
  lines.push(`    description: ${yamlString(description)}`)
  lines.push('---')
  lines.push('')

  for (const block of blocks) {
    switch (block.type) {
      case 'leadParagraph':
        if (block.content.trim()) {
          lines.push(`${block.content} {% .lead %}`)
          lines.push('')
        }
        break

      case 'paragraph':
        if (block.content.trim()) {
          lines.push(block.content)
          lines.push('')
        }
        break

      case 'heading2':
        lines.push(`## ${block.content}`)
        lines.push('')
        break

      case 'heading3':
        lines.push(`### ${block.content}`)
        lines.push('')
        break

      case 'heading4':
        lines.push(`#### ${block.content}`)
        lines.push('')
        break

      case 'bulletList':
        for (const item of block.content.split('\n').filter(Boolean)) {
          lines.push(`- ${item}`)
        }
        lines.push('')
        break

      case 'numberedList': {
        const items = block.content.split('\n').filter(Boolean)
        items.forEach((item, i) => {
          lines.push(`${i + 1}. ${item}`)
        })
        lines.push('')
        break
      }

      case 'code':
        lines.push('```' + (block.props.language || ''))
        lines.push(block.content)
        lines.push('```')
        lines.push('')
        break

      case 'callout': {
        const type = block.props.type || 'note'
        const titleAttr = block.props.title
          ? ` title="${escapeDoubleQuotes(block.props.title)}"`
          : ''
        const typeAttr = type !== 'note' ? ` type="${type}"` : ''
        lines.push(`{% callout${typeAttr}${titleAttr} %}`)
        lines.push(block.content)
        lines.push('{% /callout %}')
        lines.push('')
        break
      }

      case 'table': {
        const { headers = [], rows = [] } = block.props
        if (headers.length > 0) {
          lines.push('| ' + headers.join(' | ') + ' |')
          lines.push('| ' + headers.map(() => '---').join(' | ') + ' |')
          for (const row of rows) {
            const cells = headers.map((_, i) => row[i] || '')
            lines.push('| ' + cells.join(' | ') + ' |')
          }
          lines.push('')
        }
        break
      }

      case 'quickLinks': {
        const { links = [] } = block.props
        lines.push('{% quick-links %}')
        lines.push('')
        for (const link of links) {
          lines.push(
            `{% quick-link title="${escapeDoubleQuotes(link.title)}" icon="${link.icon || 'installation'}" href="${link.href}" description="${escapeDoubleQuotes(link.description)}" /%}`,
          )
          lines.push('')
        }
        lines.push('{% /quick-links %}')
        lines.push('')
        break
      }

      case 'divider':
        lines.push('---')
        lines.push('')
        break

      case 'image':
        if (block.props.src) {
          lines.push(
            `{% figure src="${block.props.src}" alt="${escapeDoubleQuotes(block.props.alt || '')}" caption="${escapeDoubleQuotes(block.props.caption || '')}" /%}`,
          )
          lines.push('')
        }
        break

      default:
        if (block.content) {
          lines.push(block.content)
          lines.push('')
        }
    }
  }

  return lines.join('\n')
}

/**
 * formats a string for YAML frontmatter.
 * the existing page.md files use unquoted values for both title and
 * description, so we only quote when absolutely necessary for YAML safety.
 */
function yamlString(s) {
  if (!s) return "''"
  // quote only when the value starts with a YAML-special char or contains
  // characters that would break YAML parsing
  if (/^[&*!|>{%@`'"]/.test(s) || /[:#\[\]{}]/.test(s)) {
    return `'${s.replace(/'/g, "''")}'`
  }
  return s
}

function escapeDoubleQuotes(s) {
  return (s || '').replace(/"/g, '\\"')
}
