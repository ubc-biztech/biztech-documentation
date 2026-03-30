import { createEmptyBlock } from './blocks'

/**
 * page templates for builder. these templates are ai generated
 */
export const PAGE_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Page',
    description: 'Start from scratch with an empty page.',
    icon: '📄',
    create: () => ({
      title: '',
      section: '',
      description: '',
      blocks: [
        createEmptyBlock('leadParagraph'),
        createEmptyBlock('divider'),
        createEmptyBlock('heading2'),
      ],
    }),
  },
  {
    id: 'getting-started',
    name: 'Getting Started Guide',
    description: 'Onboarding guide with prerequisites, steps, and callouts.',
    icon: '🚀',
    create: () => ({
      title: 'Getting Started with [Feature]',
      section: 'Guides',
      description: 'Everything you need to set up and start using [Feature].',
      blocks: [
        {
          ...createEmptyBlock('leadParagraph'),
          content:
            'Everything you need to set up and start using [Feature] from scratch.',
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Prerequisites',
        },
        {
          ...createEmptyBlock('paragraph'),
          content:
            'Before you begin, make sure you have the following installed:',
        },
        {
          ...createEmptyBlock('table'),
          props: {
            headers: ['Tool', 'Version', 'Install'],
            rows: [
              ['Node.js', 'v20+', '`brew install node`'],
              ['npm', 'v9+', 'Included with Node'],
            ],
          },
        },
        {
          ...createEmptyBlock('callout'),
          content: 'Replace these with the actual prerequisites for your feature.',
          props: { title: 'Customize this', type: 'note' },
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Step 1: Installation',
        },
        {
          ...createEmptyBlock('paragraph'),
          content: 'Describe the first step here.',
        },
        {
          ...createEmptyBlock('code'),
          content: 'npm install your-package',
          props: { language: 'bash' },
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Step 2: Configuration',
        },
        {
          ...createEmptyBlock('paragraph'),
          content: 'Walk through the configuration process.',
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Next Steps',
        },
        {
          ...createEmptyBlock('quickLinks'),
          props: {
            links: [
              {
                title: 'API Reference',
                description: 'Explore the full API.',
                href: '/docs/api-reference',
                icon: 'installation',
              },
              {
                title: 'Deep Dive',
                description: 'Understand how it works under the hood.',
                href: '/docs/',
                icon: 'presets',
              },
            ],
          },
        },
      ],
    }),
  },
  {
    id: 'api-reference',
    name: 'API Reference',
    description: 'Endpoint documentation with tables, code samples, and auth info.',
    icon: '🔌',
    create: () => ({
      title: '[Service] API',
      section: 'API Reference',
      description: 'Endpoint reference for the [Service] API.',
      blocks: [
        {
          ...createEmptyBlock('leadParagraph'),
          content:
            'Complete endpoint reference for the [Service] API.',
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Endpoints',
        },
        {
          ...createEmptyBlock('table'),
          props: {
            headers: ['Method', 'Path', 'Auth', 'Description'],
            rows: [
              ['GET', '`/api/resource`', '🔓', 'List all resources'],
              ['POST', '`/api/resource`', '🔑', 'Create a resource'],
              ['GET', '`/api/resource/:id`', '🔓', 'Get one resource'],
              ['PUT', '`/api/resource/:id`', '🔑', 'Update a resource'],
              ['DELETE', '`/api/resource/:id`', '🔑', 'Delete a resource'],
            ],
          },
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'GET /api/resource',
        },
        {
          ...createEmptyBlock('paragraph'),
          content: 'Returns a list of all resources. Requires authentication.',
        },
        {
          ...createEmptyBlock('heading3'),
          content: 'Request',
        },
        {
          ...createEmptyBlock('code'),
          content: 'curl -H "Authorization: Bearer $TOKEN" \\\n  https://api.ubcbiztech.com/api/resource',
          props: { language: 'bash' },
        },
        {
          ...createEmptyBlock('heading3'),
          content: 'Response',
        },
        {
          ...createEmptyBlock('code'),
          content:
            '{\n  "data": [\n    {\n      "id": "abc-123",\n      "name": "Example",\n      "createdAt": "2024-01-15T00:00:00Z"\n    }\n  ],\n  "count": 1\n}',
          props: { language: 'json' },
        },
        {
          ...createEmptyBlock('callout'),
          content: 'All timestamps are in ISO 8601 format (UTC).',
          props: { title: 'Note', type: 'note' },
        },
      ],
    }),
  },
  {
    id: 'feature-overview',
    name: 'Feature Overview',
    description: 'Explain a feature with architecture, usage, and examples.',
    icon: '⚙️',
    create: () => ({
      title: '[Feature Name]',
      section: 'Features',
      description: 'How [Feature] works and how to use it.',
      blocks: [
        {
          ...createEmptyBlock('leadParagraph'),
          content:
            'A comprehensive guide to how [Feature] works, including architecture, data flow, and usage examples.',
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Overview',
        },
        {
          ...createEmptyBlock('paragraph'),
          content:
            'Explain what this feature does, why it exists, and who uses it.',
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Architecture',
        },
        {
          ...createEmptyBlock('paragraph'),
          content:
            'Describe the high-level architecture. What services, tables, and components are involved?',
        },
        {
          ...createEmptyBlock('heading3'),
          content: 'Data Flow',
        },
        {
          ...createEmptyBlock('numberedList'),
          content:
            'User triggers an action on the frontend\nFrontend calls the API endpoint\nLambda processes the request and updates DynamoDB\nResponse is sent back to the frontend',
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Key Files',
        },
        {
          ...createEmptyBlock('table'),
          props: {
            headers: ['File', 'Purpose'],
            rows: [
              ['`services/feature/handler.js`', 'Lambda handler with route definitions'],
              ['`services/feature/helpers.js`', 'Business logic and validation'],
              ['`src/pages/feature/index.tsx`', 'Frontend page component'],
            ],
          },
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Usage Example',
        },
        {
          ...createEmptyBlock('code'),
          content: '// Example usage\nconst result = await fetchFeature(id)\nconsole.log(result)',
          props: { language: 'javascript' },
        },
        {
          ...createEmptyBlock('callout'),
          content: 'Remember to handle error cases. The API returns 404 if the resource is not found.',
          props: { title: 'Important', type: 'warning' },
        },
      ],
    }),
  },
  {
    id: 'component-docs',
    name: 'Component Documentation',
    description: 'Document a React component with props, usage, and examples.',
    icon: '🧩',
    create: () => ({
      title: '[ComponentName]',
      section: 'Components',
      description: 'Documentation for the [ComponentName] React component.',
      blocks: [
        {
          ...createEmptyBlock('leadParagraph'),
          content:
            'A reusable component for [purpose]. Used across [pages/features].',
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Import',
        },
        {
          ...createEmptyBlock('code'),
          content: "import { ComponentName } from '@/components/ComponentName'",
          props: { language: 'tsx' },
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Props',
        },
        {
          ...createEmptyBlock('table'),
          props: {
            headers: ['Prop', 'Type', 'Default', 'Description'],
            rows: [
              ['`title`', '`string`', '-', 'The display title'],
              ['`variant`', '`"default" | "compact"`', '`"default"`', 'Visual style variant'],
              ['`onClick`', '`() => void`', '-', 'Click handler (optional)'],
            ],
          },
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Basic Usage',
        },
        {
          ...createEmptyBlock('code'),
          content:
            '<ComponentName\n  title="Hello World"\n  variant="default"\n  onClick={() => console.log("clicked")}\n/>',
          props: { language: 'tsx' },
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Examples',
        },
        {
          ...createEmptyBlock('heading3'),
          content: 'Default Variant',
        },
        {
          ...createEmptyBlock('paragraph'),
          content: 'The default variant is used in most places.',
        },
        {
          ...createEmptyBlock('heading3'),
          content: 'Compact Variant',
        },
        {
          ...createEmptyBlock('paragraph'),
          content: 'The compact variant is used in tight layouts like sidebars.',
        },
        {
          ...createEmptyBlock('callout'),
          content: 'This component must be wrapped in a client boundary (`"use client"`) if it uses interactivity.',
          props: { title: 'Client Component', type: 'note' },
        },
      ],
    }),
  },
  {
    id: 'how-to',
    name: 'How-To Guide',
    description: 'Step-by-step instructions for a specific task.',
    icon: '📋',
    create: () => ({
      title: 'How to [Do Something]',
      section: 'Guides',
      description: 'Step-by-step guide for [doing something].',
      blocks: [
        {
          ...createEmptyBlock('leadParagraph'),
          content:
            'A quick walkthrough for [task]. Follow these steps and you will be up and running in minutes.',
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Before You Start',
        },
        {
          ...createEmptyBlock('bulletList'),
          content:
            'You have the repo cloned and running locally\nYou have access to the BizTech AWS account\nYou have read the Getting Started guide',
        },
        {
          ...createEmptyBlock('callout'),
          content: 'If you get stuck, ask in the #dev Slack channel.',
          props: { title: 'Need help?', type: 'note' },
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Step 1: [First Step]',
        },
        {
          ...createEmptyBlock('paragraph'),
          content: 'Explain what to do and why.',
        },
        {
          ...createEmptyBlock('code'),
          content: '# Terminal command for this step',
          props: { language: 'bash' },
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Step 2: [Second Step]',
        },
        {
          ...createEmptyBlock('paragraph'),
          content: 'Continue with the next step.',
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Step 3: [Third Step]',
        },
        {
          ...createEmptyBlock('paragraph'),
          content: 'Almost done.',
        },
        createEmptyBlock('divider'),
        {
          ...createEmptyBlock('heading2'),
          content: 'Troubleshooting',
        },
        {
          ...createEmptyBlock('callout'),
          content: 'If you see [error], try [fix]. This is usually caused by [reason].',
          props: { title: 'Common Issue', type: 'warning' },
        },
      ],
    }),
  },
]
