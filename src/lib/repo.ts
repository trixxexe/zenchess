/**
 * On GitHub Pages the site lives at `<user>.github.io/<repo>/`, so the source
 * repository is always derivable from the current URL. Locally there is no
 * repository to point at, so the link falls back to GitHub itself.
 */
export function repoUrl(): string {
  if (typeof window === 'undefined') return 'https://github.com'
  const { hostname, pathname } = window.location
  const match = /^([^.]+)\.github\.io$/i.exec(hostname)
  if (!match) return 'https://github.com'
  const repo = pathname.split('/').filter(Boolean)[0]
  return repo ? `https://github.com/${match[1]}/${repo}` : `https://github.com/${match[1]}`
}

export function issuesUrl(): string {
  return `${repoUrl()}/issues`
}
