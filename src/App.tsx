import { useEffect } from 'react'

import { AppBar } from './components/AppBar'
import { Button } from './components/Button'
import { Container } from './components/Container'
import { MobileNav } from './components/MobileNav'
import { useRoute } from './lib/router'
import { Analyse } from './pages/Analyse'
import { Home } from './pages/Home'
import { Learn, LearnArticle } from './pages/Learn'
import { Play } from './pages/Play'
import { Review } from './pages/Review'
import { SupportPage } from './pages/SupportPage'

const titles: Record<string, string> = {
  '/': 'ZenChess — free chess against Stockfish',
  '/play': 'Play chess · ZenChess',
  '/analyse': 'Analysis board · ZenChess',
  '/review': 'Game review · ZenChess',
  '/learn': 'Guides · ZenChess',
  '/support': 'Support · ZenChess',
}

export function App() {
  const route = useRoute()

  useEffect(() => {
    document.title = titles[route] ?? (route.startsWith('/learn/') ? 'Guide · ZenChess' : 'ZenChess')
  }, [route])

  return (
    <>
      {/* Room for the mobile tab bar, including the iOS home-indicator inset. */}
      <div className="pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Page route={route} />
      </div>
      <MobileNav />
    </>
  )
}

function Page({ route }: { route: string }) {
  if (route === '/play') return <Play />
  if (route === '/analyse') return <Analyse />
  if (route === '/review') return <Review />
  if (route === '/support') return <SupportPage />
  if (route === '/learn') return <Learn />
  if (route.startsWith('/learn/')) return <LearnArticle slug={route.slice('/learn/'.length)} />
  if (route === '/') return <Home />
  return <NotFound route={route} />
}

function NotFound({ route }: { route: string }) {
  return (
    <div className="min-h-dvh">
      <AppBar />
      <Container className="pt-20">
        <p className="text-[13px] text-accent">404</p>
        <h1 className="mt-2 text-[32px] font-semibold tracking-tight">There is no page at {route}</h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
          The board is still here. Everything in ZenChess lives in play, analysis, review and the guides.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button href="#/play">Play a game</Button>
          <Button href="#/" variant="secondary">
            Back home
          </Button>
        </div>
      </Container>
    </div>
  )
}
