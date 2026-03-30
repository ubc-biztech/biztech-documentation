let _blockId = 0

export function generateBlockId() {
  return `block-${Date.now()}-${++_blockId}`
}

/**
 * all block types supported by the builder.
 *
 * each block has:
 *   id       - unique identifier
 *   type     - one of the types below
 *   content  - main text content (markdown-ish, but plain text in the editor)
 *   props    - type-specific properties
 */
export const BLOCK_TYPES = {
  leadParagraph: { label: 'Lead Paragraph', icon: '★', shortcut: 'l' },
  paragraph: { label: 'Paragraph', icon: '¶', shortcut: 'p' },
  heading2: { label: 'Heading 2', icon: 'H2', shortcut: '2' },
  heading3: { label: 'Heading 3', icon: 'H3', shortcut: '3' },
  heading4: { label: 'Heading 4', icon: 'H4', shortcut: '4' },
  bulletList: { label: 'Bullet List', icon: '•', shortcut: 'b' },
  numberedList: { label: 'Numbered List', icon: '1.', shortcut: 'n' },
  code: { label: 'Code Block', icon: '<>', shortcut: 'c' },
  callout: { label: 'Callout', icon: '💡', shortcut: 'o' },
  table: { label: 'Table', icon: '⊞', shortcut: 't' },
  quickLinks: { label: 'Quick Links', icon: '⚡', shortcut: 'q' },
  divider: { label: 'Divider', icon: '―', shortcut: 'd' },
  image: { label: 'Image', icon: '🖼', shortcut: 'i' },
}

export function createEmptyBlock(type, props = {}) {
  const base = {
    id: generateBlockId(),
    type,
    content: '',
    props: {},
  }

  switch (type) {
    case 'code':
      return { ...base, props: { language: 'javascript', ...props } }
    case 'callout':
      return { ...base, props: { title: '', type: 'note', ...props } }
    case 'table':
      return {
        ...base,
        props: {
          headers: ['Column 1', 'Column 2', 'Column 3'],
          rows: [['', '', '']],
          ...props,
        },
      }
    case 'quickLinks':
      return {
        ...base,
        props: {
          links: [{ title: '', description: '', href: '', icon: 'installation' }],
          ...props,
        },
      }
    case 'leadParagraph':
      return { ...base, ...props }
    case 'bulletList':
    case 'numberedList':
      return { ...base, content: '', ...props }
    case 'image':
      return { ...base, props: { src: '', alt: '', caption: '', ...props } }
    case 'divider':
      return { ...base }
    default:
      return { ...base, ...props }
  }
}
