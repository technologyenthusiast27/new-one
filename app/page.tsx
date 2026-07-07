import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Experience } from "@/components/Experience";
import { Passes } from "@/components/Passes";
import { Lineup } from "@/components/Lineup";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <Hero />
        <Marquee />
        <Experience />
        <Lineup />
        <Passes />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
