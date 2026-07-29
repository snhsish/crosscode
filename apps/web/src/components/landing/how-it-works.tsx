import { Terminal, QrCode, Smartphone } from "lucide-react";

const steps = [
  {
    icon: Terminal,
    step: "01",
    title: "Run the CLI",
    description: "Run npx crosscode on your PC. It starts OpenCode and opens a secure tunnel automatically.",
  },
  {
    icon: QrCode,
    step: "02",
    title: "Scan the QR",
    description: "A QR code appears in your terminal. Open the CrossCode app and scan it to connect.",
  },
  {
    icon: Smartphone,
    step: "03",
    title: "Control from anywhere",
    description: "Chat with your AI agent, approve tool calls, and review changes, all from your phone.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container py-20">
      <div className="rounded-3xl bg-muted/30 p-6 md:p-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            Get started in under a minute
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div key={step.step} className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {step.step}
                </span>
              </div>
              <h3 className="text-xl font-semibold mt-2">{step.title}</h3>
              <p className="mt-2 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
