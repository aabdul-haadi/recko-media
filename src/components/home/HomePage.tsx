import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "./sections/Hero";
import { Services } from "./sections/Services";
import { Process } from "./sections/Process";
import { ConnectedStory } from "./sections/ConnectedStory";
import { Work } from "./sections/Work";
import { MotionHighlights } from "./sections/MotionHighlights";
import { Reviews } from "./sections/Reviews";
import { Attention } from "./sections/Attention";
import { Contact } from "./sections/Contact";
import "./brand-theme.css";

export function HomePage() {
  return (
    <div className="recko-home">
      <SmoothScroll />
      <Header />
      <main>
        <Hero />
        <Services />
        <Process />
        <ConnectedStory />
        <Work />
        <MotionHighlights />
        <Reviews />
        <Attention />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
