import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Hero />
      </main>
    </div>
  );
}
