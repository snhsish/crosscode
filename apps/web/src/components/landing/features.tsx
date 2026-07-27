import { Card, CardContent } from "@/components/ui/card";
import {
  QrCode,
  MessageSquare,
  GitBranch,
  Shield,
  Bell,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "QR Connect",
    description: "Scan and connect in one tap. No copy-pasting URLs or manual configuration.",
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Stream responses live with full markdown and code block rendering.",
  },
  {
    icon: GitBranch,
    title: "Inline Diffs",
    description: "See exactly what the agent changed before it happens with side-by-side view.",
  },
  {
    icon: Shield,
    title: "Tool Approvals",
    description: "Approve or reject every shell command, file write, or API call before it runs.",
  },
  {
    icon: Bell,
    title: "Push Notifications",
    description: "Get notified when the agent finishes, needs approval, or hits an error.",
  },
  {
    icon: Smartphone,
    title: "Works Anywhere",
    description: "Mobile data, different WiFi, across the world — no shared network required.",
  },
];

export function Features() {
  return (
    <section id="features" className="container py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">Everything you need</h2>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
          Full control over your AI coding agent from your phone
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="border-0 shadow-none bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
