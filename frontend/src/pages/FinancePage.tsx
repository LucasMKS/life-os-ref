import { Navbar } from "@/components/navbar";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";
import { Wallet } from "lucide-react";

export default function FinanceHub() {
  return (
    <main className="min-h-screen flex flex-col relative bg-[#09090b] text-zinc-100 selection:bg-amber-500/30 overflow-hidden">
      {/* Glows de fundo Âmbar e Laranja */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none -ml-40 -mt-20"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none -mr-40 -mt-20"></div>

      {/* Watermark Gigante */}
      <Wallet
        className="absolute top-40 right-10 w-[600px] h-[600px] text-white opacity-[0.015] pointer-events-none -rotate-12"
        strokeWidth={1}
      />

      <Navbar />

      <div className="z-10 w-full max-w-[1400px] mx-auto mt-4 md:mt-12 px-4 md:px-6 pb-12 md:pb-20">
        <div className="mb-5 md:mb-10 text-center w-full flex flex-col items-center relative">
          <span className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase bg-white/5 border border-white/10 rounded-full text-amber-400 mb-2 md:mb-4 backdrop-blur-md">
            Seu Dinheiro
          </span>
          <h1 className="text-2xl md:text-5xl font-bold tracking-tight mb-1.5 md:mb-3 text-white">
            Suas{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Assinaturas
            </span>
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto text-xs md:text-base font-medium hidden sm:block">
            Gerencie o que você paga todo mês. Nada de ser pego de surpresa pelo
            cartão de crédito.
          </p>
        </div>

        <div className="relative">
          <FinanceDashboard />
        </div>
      </div>
    </main>
  );
}
