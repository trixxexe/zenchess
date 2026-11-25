import { AppBar } from '../components/AppBar'
import { Footer } from '../sections/Footer'
import { Support } from '../sections/Support'

export function SupportPage() {
  return (
    <div className="min-h-dvh">
      <AppBar />
      <main>
        <Support />
      </main>
      <Footer />
    </div>
  )
}
