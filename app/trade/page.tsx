import TradeForm from "@/components/TradeForm";

export default function TradePage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Trade Analyzer</h1>
        <p className="text-muted font-cond text-sm uppercase tracking-wider">
          Propose a deal · get a dynasty verdict with stats context
        </p>
      </header>
      <TradeForm />
    </div>
  );
}
