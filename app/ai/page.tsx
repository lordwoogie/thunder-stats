import AIPanel from "@/components/AIPanel";

export default function AIPage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">AI Analysis</h1>
        <p className="text-muted font-cond text-sm uppercase tracking-wider">
          Claude-powered dynasty advisor · live league context
        </p>
      </header>
      <AIPanel />
    </div>
  );
}
