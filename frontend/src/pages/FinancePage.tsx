import { Wallet } from "lucide-react";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";

export default function FinanceHub() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Finanças"
        icon={<Wallet className="w-3.5 h-3.5" />}
        title="Finanças & Assinaturas"
        subtitle="Acompanhe seus gastos recorrentes, datas de vencimento e distribuição de custos mensais."
        accent="cyan"
      />
      <FinanceDashboard />
    </PageShell>
  );
}
