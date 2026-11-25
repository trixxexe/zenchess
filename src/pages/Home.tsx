import { Cta } from '../sections/Cta'
import { Faq } from '../sections/Faq'
import { Features } from '../sections/Features'
import { Footer } from '../sections/Footer'
import { FreeForever } from '../sections/FreeForever'
import { Hero } from '../sections/Hero'
import { Levels } from '../sections/Levels'
import { LogoCloud } from '../sections/LogoCloud'
import { Metrics } from '../sections/Metrics'
import { Nav } from '../sections/Nav'
import { Showcase } from '../sections/Showcase'
import { Steps } from '../sections/Steps'
import { Support } from '../sections/Support'

export function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <LogoCloud />
        <Features />
        <Levels />
        <Steps />
        <Showcase />
        <Metrics />
        <FreeForever />
        <Faq />
        <Support />
        <Cta />
      </main>
      <Footer />
    </>
  )
}
