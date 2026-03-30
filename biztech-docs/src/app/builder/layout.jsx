export const metadata = {
  title: 'Page Builder - BizTech Docs',
  description: 'Visual page builder for BizTech documentation.',
}

export default function BuilderLayout({ children }) {
  return (
    <div className="h-screen w-full overflow-hidden">
      {children}
    </div>
  )
}
