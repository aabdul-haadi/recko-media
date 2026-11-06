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
import { Faq } from "./sections/Faq";
import { Contact } from "./sections/Contact";
import { useSection } from "@/lib/content/content";
import type { ReactNode } from "react";
import "./brand-theme.css";

/** Renders a section only when the admin has it enabled. */
function Toggle({ name, children }: { name: string; children: ReactNode }) {
  const { enabled } = useSection(name);
  return enabled ? <>{children}</> : null;
}

export function HomePage() {
  return (
    <div className="recko-home">
      <SmoothScroll />
      <Header />
      <main>
        <Hero />
        <Toggle name="services_intro"><Services /></Toggle>
        <Toggle name="process"><Process /></Toggle>
        <ConnectedStory />
        <Toggle name="work"><Work /></Toggle>
        <MotionHighlights />
        <Toggle name="reviews"><Reviews /></Toggle>
        <Toggle name="faq"><Faq /></Toggle>
        <Toggle name="attention"><Attention /></Toggle>
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
