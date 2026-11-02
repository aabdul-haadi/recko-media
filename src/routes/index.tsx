import { createFileRoute } from "@tanstack/react-router";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Process } from "@/components/sections/Process";
import { Partnership } from "@/components/sections/Partnership";
import { Work } from "@/components/sections/Work";
import { Reviews } from "@/components/sections/Reviews";
import { Attention } from "@/components/sections/Attention";
import { Contact } from "@/components/sections/Contact";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recko Media — Web Design, AI Automation & Digital Marketing" },
      {
        name: "description",
        content:
          "Growth systems that move revenue. Web design, AI automation and digital marketing built together for your business.",
      },
      {
        property: "og:title",
        content: "Recko Media — Web Design, AI Automation & Digital Marketing",
      },
      {
        property: "og:description",
        content:
          "Growth systems that move revenue. Web design, AI automation and digital marketing built together.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main>
        <Hero />
        <Services />
        <Process />
        <Partnership />
        <Work />
        <Reviews />
        <Attention />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
