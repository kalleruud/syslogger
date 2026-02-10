// Type declarations for HTML imports in Bun.serve
declare module '*.html' {
  const content: string
  export default content
}
