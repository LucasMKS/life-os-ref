"use client";

import { Plane, Hotel, FileText, Edit3 } from "lucide-react";
import { Trip } from "@/lib/types";

interface TripTransportHotelTabProps {
  trip: Trip;
  onEditTrip: () => void;
}

export function TripTransportHotelTab({ trip, onEditTrip }: TripTransportHotelTabProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plane className="text-zinc-400" size={18} />
            Transporte & Hospedagem
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dados de voos, passagens, reservas de hotel e informações gerais da viagem.
          </p>
        </div>

        <button
          type="button"
          onClick={onEditTrip}
          className="inline-flex items-center gap-1.5 bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] font-medium text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Edit3 size={13} />
          <span>Editar Informações</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Voo & Transporte */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#09090b] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plane className="text-zinc-400" size={16} />
                Passagens & Transporte
              </h3>
              <span className="text-[10px] font-medium text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                Voos / Trens / Transfer
              </span>
            </div>

            {trip.flightInfo ? (
              <div className="p-3.5 rounded-xl bg-[#111113] border border-white/[0.06] text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
                {trip.flightInfo}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-[#111113] rounded-xl border border-dashed border-white/[0.08]">
                <Plane className="text-zinc-600 w-7 h-7 mx-auto mb-2" />
                <p className="text-zinc-500 text-xs">
                  Nenhuma informação de transporte cadastrada.
                </p>
                <button
                  type="button"
                  onClick={onEditTrip}
                  className="mt-2.5 text-zinc-200 hover:text-white text-xs font-medium underline cursor-pointer"
                >
                  Adicionar voos / bilhetes
                </button>
              </div>
            )}
          </div>

          <div className="pt-3.5 mt-5 border-t border-white/[0.06] text-[11px] text-zinc-500">
            Dica: guarde localizadores, assentos e terminais.
          </div>
        </div>

        {/* Hotel & Hospedagem */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#09090b] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Hotel className="text-zinc-400" size={16} />
                Hospedagem & Acomodação
              </h3>
              <span className="text-[10px] font-medium text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                Hotel / Airbnb
              </span>
            </div>

            {trip.hotelInfo ? (
              <div className="p-3.5 rounded-xl bg-[#111113] border border-white/[0.06] text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
                {trip.hotelInfo}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-[#111113] rounded-xl border border-dashed border-white/[0.08]">
                <Hotel className="text-zinc-600 w-7 h-7 mx-auto mb-2" />
                <p className="text-zinc-500 text-xs">Nenhuma hospedagem cadastrada.</p>
                <button
                  type="button"
                  onClick={onEditTrip}
                  className="mt-2.5 text-zinc-200 hover:text-white text-xs font-medium underline cursor-pointer"
                >
                  Adicionar hotel / endereço
                </button>
              </div>
            )}
          </div>

          <div className="pt-3.5 mt-5 border-t border-white/[0.06] text-[11px] text-zinc-500">
            Dica: anote senhas de Wi-Fi e horários de check-in/out.
          </div>
        </div>
      </div>

      {/* Notas Gerais da Viagem */}
      {trip.notes && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#09090b] p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="text-zinc-400" size={16} />
            Anotações Gerais & Dicas da Viagem
          </h3>
          <div className="p-3.5 rounded-xl bg-[#111113] border border-white/[0.06] text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {trip.notes}
          </div>
        </div>
      )}
    </div>
  );
}
