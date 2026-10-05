"use client";

import { Plane, Hotel, FileText, Edit3, Calendar, MapPin } from "lucide-react";
import { Trip } from "@/lib/types";

interface TripTransportHotelTabProps {
  trip: Trip;
  onEditTrip: () => void;
}

export function TripTransportHotelTab({ trip, onEditTrip }: TripTransportHotelTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plane className="text-sky-400" size={20} />
            Transporte, Hospedagem & Informações Úteis
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dados de voos, passagens, reservas de hotel e anotações gerais da viagem.
          </p>
        </div>

        <button
          onClick={onEditTrip}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/10 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Edit3 size={14} />
          Editar Informações
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voo & Transporte */}
        <div className="rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-950/20 via-zinc-900/40 to-zinc-950 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plane className="text-sky-400" size={18} />
                Passagens & Transporte
              </h3>
              <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                Voos / Trens / Transfer
              </span>
            </div>

            {trip.flightInfo ? (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
                {trip.flightInfo}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-zinc-900/20 rounded-2xl border border-dashed border-white/5">
                <Plane className="text-zinc-600 w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-zinc-500 text-xs">Nenhuma informação de transporte cadastrada.</p>
                <button
                  onClick={onEditTrip}
                  className="mt-3 text-sky-400 hover:text-sky-300 text-xs font-semibold underline cursor-pointer"
                >
                  Adicionar voos / bilhetes
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 mt-6 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
            <span>Dica: guarde localizadores, assentos e terminais.</span>
          </div>
        </div>

        {/* Hotel & Hospedagem */}
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-zinc-900/40 to-zinc-950 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Hotel className="text-amber-400" size={18} />
                Hospedagem & Acomodação
              </h3>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Hotel / Airbnb
              </span>
            </div>

            {trip.hotelInfo ? (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
                {trip.hotelInfo}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-zinc-900/20 rounded-2xl border border-dashed border-white/5">
                <Hotel className="text-zinc-600 w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-zinc-500 text-xs">Nenhuma hospedagem cadastrada.</p>
                <button
                  onClick={onEditTrip}
                  className="mt-3 text-amber-400 hover:text-amber-300 text-xs font-semibold underline cursor-pointer"
                >
                  Adicionar hotel / endereço
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 mt-6 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
            <span>Dica: anote senhas de Wi-Fi e horários de check-in/out.</span>
          </div>
        </div>
      </div>

      {/* Notas Gerais da Viagem */}
      {trip.notes && (
        <div className="rounded-3xl border border-white/5 bg-zinc-900/30 p-6 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="text-sky-400" size={16} />
            Anotações Gerais & Dicas da Viagem
          </h3>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {trip.notes}
          </div>
        </div>
      )}
    </div>
  );
}
