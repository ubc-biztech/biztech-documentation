export const navigation = [
  {
    title: 'Getting Started',
    links: [
      { title: 'Introduction', href: '/' },
      { title: 'System Overview', href: '/docs/system-overview' },
      { title: 'Setup & Installation', href: '/docs/getting-started' },
      { title: 'Project Structure', href: '/docs/project-structure' },
    ],
  },
  {
    title: 'Writing Documentation',
    links: [
      {
        title: 'Adding a Docs Page',
        href: '/docs/documentation-guide/adding-a-page',
      },
      {
        title: 'Markdown Guide',
        href: '/docs/documentation-guide/markdown-guide',
      },
    ],
  },
  {
    title: 'Frontend',
    links: [
      { title: 'Architecture Overview', href: '/docs/frontend-architecture' },
      {
        title: 'Routing & Pages',
        href: '/docs/frontend-architecture/routing',
      },
      {
        title: 'Data Fetching',
        href: '/docs/frontend-architecture/data-fetching',
      },
      {
        title: 'Styling & Configuration',
        href: '/docs/frontend-architecture/styling',
      },
      { title: 'Component Library', href: '/docs/frontend-components' },
      {
        title: 'Feature Components',
        href: '/docs/frontend-components/feature-components',
      },
      {
        title: 'Patterns & Conventions',
        href: '/docs/frontend-components/patterns',
      },
    ],
  },
  {
    title: 'Backend',
    links: [
      { title: 'Architecture Overview', href: '/docs/backend-architecture' },
      {
        title: 'Handler Pattern',
        href: '/docs/backend-architecture/handler-pattern',
      },
      {
        title: 'API Gateway & Authorizer',
        href: '/docs/backend-architecture/api-gateway',
      },
      {
        title: 'DynamoDB Access Layer',
        href: '/docs/backend-architecture/dynamodb',
      },
      {
        title: 'Shared Libraries',
        href: '/docs/backend-architecture/shared-libraries',
      },
      {
        title: 'Services & Patterns',
        href: '/docs/backend-architecture/services',
      },
    ],
  },
  {
    title: 'Authentication',
    links: [
      { title: 'Overview', href: '/docs/authentication' },
      { title: 'Implementation', href: '/docs/authentication/implementation' },
      {
        title: 'Admin Detection',
        href: '/docs/authentication/admin-detection',
      },
    ],
  },
  {
    title: 'Identity & Members',
    links: [
      {
        title: 'User, Member & Profile Relationships',
        href: '/docs/identity/relationships',
      },
      { title: 'Users Service', href: '/docs/users' },
      { title: 'Members Service', href: '/docs/members' },
      { title: 'Profiles Service', href: '/docs/profiles' },
    ],
  },
  {
    title: 'Events',
    links: [
      { title: 'Events Overview', href: '/docs/events' },
      { title: 'Data Model', href: '/docs/events/data-model' },
      { title: 'Creation Flow', href: '/docs/events/creation-flow' },
      { title: 'Active Event Detection', href: '/docs/events/active-event' },
      { title: 'Image Upload', href: '/docs/events/image-upload' },
      {
        title: 'Registrations',
        href: '/docs/events/registrations',
      },
      {
        title: 'Pricing & Payments',
        href: '/docs/events/pricing-payments',
      },
      {
        title: 'Frontend Implementation',
        href: '/docs/events/frontend',
      },
      {
        title: 'Events Service API',
        href: '/docs/services/events',
      },
      {
        title: 'Registrations Service API',
        href: '/docs/services/registrations',
      },
      {
        title: 'Admin Dashboard',
        href: '/docs/systems/admin-events',
      },
    ],
  },
  {
    title: 'Database',
    links: [
      { title: 'Overview & Tables', href: '/docs/database' },
      {
        title: 'Schemas & Access Patterns',
        href: '/docs/database/schemas',
      },
      {
        title: 'Table Ownership Map',
        href: '/docs/database/table-ownership',
      },
    ],
  },
  {
    title: 'Systems',
    links: [
      {
        title: 'Frontend–Backend Integration',
        href: '/docs/systems/frontend-backend-integration',
      },
      {
        title: 'Request Execution Path',
        href: '/docs/systems/request-execution-path',
      },
      {
        title: 'Endpoint Registry',
        href: '/docs/systems/endpoint-registry',
      },
    ],
  },
  {
    title: 'Flows',
    links: [
      {
        title: 'Account Creation',
        href: '/docs/flows/account-creation',
      },
      {
        title: 'Membership',
        href: '/docs/flows/membership',
      },
      {
        title: 'Event Lifecycle',
        href: '/docs/flows/event-lifecycle',
      },
      {
        title: 'Registration',
        href: '/docs/systems/registration',
      },
      {
        title: 'Payment Flow',
        href: '/docs/systems/payment-flow',
      },
      {
        title: 'Event Check-In',
        href: '/docs/flows/check-in',
      },
      {
        title: 'Profile Sync',
        href: '/docs/flows/profile-sync',
      },
    ],
  },
  {
    title: 'API Reference',
    links: [
      { title: 'Overview', href: '/docs/api-reference' },
      { title: 'Core APIs', href: '/docs/api-reference/core' },
      {
        title: 'Profile & Social APIs',
        href: '/docs/api-reference/social',
      },
      {
        title: 'Admin & Specialized APIs',
        href: '/docs/api-reference/admin',
      },
    ],
  },
  {
    title: 'Guides',
    links: [
      {
        title: 'Adding a Feature',
        href: '/docs/guides/adding-a-feature',
      },
      {
        title: 'Adding an API Endpoint',
        href: '/docs/guides/adding-an-endpoint',
      },
      {
        title: 'Tracing a Feature',
        href: '/docs/systems/tracing-features',
      },
      { title: 'Environment & Config', href: '/docs/guides/environment' },
      { title: 'Local Dev & Debugging', href: '/docs/guides/debugging' },
      { title: 'Deployment', href: '/docs/deployment' },
      { title: 'Testing', href: '/docs/guides/testing' },
    ],
  },
  {
    title: 'CI/CD & Deployment',
    links: [
      { title: 'Overview', href: '/docs/cicd' },
      {
        title: 'Frontend Workflows',
        href: '/docs/cicd/frontend-workflows',
      },
      {
        title: 'Backend Workflows',
        href: '/docs/cicd/backend-workflows',
      },

      {
        title: 'Docs & Bot Sync',
        href: '/docs/cicd/docs-sync',
      },
    ],
  },
  {
    title: 'Companion App',
    links: [{ title: 'Overview', href: '/docs/deep-dives/companion' }],
  },
  {
    title: 'Live Wall',
    links: [
      { title: 'Overview', href: '/docs/deep-dives/live-wall' },
      {
        title: 'Frontend Architecture',
        href: '/docs/deep-dives/live-wall/frontend',
      },
      {
        title: 'Key Features',
        href: '/docs/deep-dives/live-wall/features',
      },
      {
        title: 'Backend & WebSocket',
        href: '/docs/deep-dives/live-wall/backend',
      },
      {
        title: 'Customization & Reference',
        href: '/docs/deep-dives/live-wall/customization',
      },
    ],
  },
  {
    title: 'BTX Exchange',
    links: [
      { title: 'Overview', href: '/docs/deep-dives/btx' },
      {
        title: 'Price Mechanics',
        href: '/docs/deep-dives/btx/price-mechanics',
      },
      { title: 'Database & API', href: '/docs/deep-dives/btx/database-api' },
      {
        title: 'Trade Execution & Frontend',
        href: '/docs/deep-dives/btx/trade-execution',
      },
      {
        title: 'Configuration & Development',
        href: '/docs/deep-dives/btx/configuration',
      },
    ],
  },
  {
    title: 'NFC & QR',
    links: [
      { title: 'Overview', href: '/docs/deep-dives/nfc-cards' },
      {
        title: 'QR Code Check-In',
        href: '/docs/deep-dives/nfc-cards/qr-checkin',
      },
      {
        title: 'NFC Card Writing',
        href: '/docs/deep-dives/nfc-cards/nfc-writing',
      },
      {
        title: 'Connections & Testing',
        href: '/docs/deep-dives/nfc-cards/connections',
      },
    ],
  },
  {
    title: 'Event Feedback',
    links: [
      { title: 'Overview', href: '/docs/deep-dives/event-feedback' },
      {
        title: 'Admin Form Builder',
        href: '/docs/deep-dives/event-feedback/admin-builder',
      },
      {
        title: 'Public Forms',
        href: '/docs/deep-dives/event-feedback/public-forms',
      },
      {
        title: 'Backend API & Data Model',
        href: '/docs/deep-dives/event-feedback/backend-api',
      },
    ],
  },
  {
    title: 'Instagram Analytics',
    links: [
      { title: 'Overview', href: '/docs/deep-dives/instagram-analytics' },
      {
        title: 'Dashboard Guide',
        href: '/docs/deep-dives/instagram-analytics/dashboard',
      },
      {
        title: 'Backend & Token Operations',
        href: '/docs/deep-dives/instagram-analytics/backend-token',
      },
      {
        title: 'Troubleshooting',
        href: '/docs/deep-dives/instagram-analytics/troubleshooting',
      },
    ],
  },
  {
    title: 'Partnerships CRM',
    links: [
      { title: 'Overview', href: '/docs/deep-dives/partnerships-crm' },
      {
        title: 'Architecture & File Map',
        href: '/docs/deep-dives/partnerships-crm/architecture',
      },
      {
        title: 'Data Model',
        href: '/docs/deep-dives/partnerships-crm/data-model',
      },
      {
        title: 'Admin Workflows',
        href: '/docs/deep-dives/partnerships-crm/admin-workflows',
      },
      {
        title: 'Overview Tab',
        href: '/docs/deep-dives/partnerships-crm/overview-tab',
      },
      {
        title: 'Partners Tab',
        href: '/docs/deep-dives/partnerships-crm/partners-tab',
      },
      {
        title: 'Events Tab',
        href: '/docs/deep-dives/partnerships-crm/events-tab',
      },
      {
        title: 'Backend API',
        href: '/docs/deep-dives/partnerships-crm/backend-api',
      },
      {
        title: 'Email Ops',
        href: '/docs/deep-dives/partnerships-crm/email-ops',
      },
      {
        title: 'Gmail Sync Setup',
        href: '/docs/deep-dives/partnerships-crm/gmail-sync',
      },
      {
        title: 'Google Sheets Sync',
        href: '/docs/deep-dives/partnerships-crm/google-sheets-sync',
      },
      {
        title: 'Google Sheets Mapping',
        href: '/docs/deep-dives/partnerships-crm/google-sheets-mapping',
      },
      {
        title: 'Troubleshooting',
        href: '/docs/deep-dives/partnerships-crm/troubleshooting',
      },
    ],
  },
  {
    title: 'Discord & Slack Bots',
    links: [{ title: 'Overview', href: '/docs/deep-dives/bots' }],
  },
  {
    title: 'Email Service',
    links: [{ title: 'Overview', href: '/docs/deep-dives/emails' }],
  },
  {
    title: 'Prizes & Transactions',
    links: [
      { title: 'Overview', href: '/docs/deep-dives/prizes-transactions' },
    ],
  },

  {
    title: 'Legacy API Docs',
    links: [
      { title: 'Connections', href: '/docs/connections' },
      { title: 'Teams', href: '/docs/teams' },
      { title: 'Investments', href: '/docs/investments' },
      { title: 'Quizzes', href: '/docs/quizzes' },
      { title: 'Quests', href: '/docs/quests' },
      { title: 'QR Codes', href: '/docs/qr' },
    ],
  },
  {
    title: 'Judging Portal',
    links: [
      { title: 'Overview', href: '/docs/judging-portal' },
      { title: 'Setup', href: '/docs/judging-portal/setup' },
      { title: 'Data Model', href: '/docs/judging-portal/data-model' },
      { title: 'Routes', href: '/docs/judging-portal/routes' },
    ],
  },
]
