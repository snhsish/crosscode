import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Hero />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
