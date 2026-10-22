import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronDown,
  History,
  RefreshCw,
  Settings2,
  Star,
  Trophy,
} from "lucide-react";
import { sportsApi } from "@/lib/api";
import { SportMatch, SportsUserPreferences } from "@/lib/types";
import { translateLeagueName } from "@/lib/sports-translations";
import { getLocalDateString } from "@/lib/date-utils";
import { MatchRow, TeamLogo } from "./match-row";
import { SportsRadar } from "./sports-radar";
import { PanelEmpty, RowSkeleton, SportsPanel } from "./sports-panel";
import {
  FavoriteLookup,
  SUPPORTED_LEAGUES,
  findLeague,
  isFavoriteMatch,
  isFinishedStatus,
  isLiveStatus,
  matchTimestamp,
  normalizeLeagueSlug,
} from "./sports-utils";

// O modal só é baixado quando o usuário abre uma partida.
const MatchDetailModal = lazy(() =>
  import("./match-detail-modal").then((m) => ({ default: m.MatchDetailModal }))
);

type ViewFilter = "all" | "live" | "favorites";

const DAY_RANGE_BEFORE = 3;
const DAY_RANGE_AFTER = 6;

function shiftDate(base: string, days: number): string {
  const [y, m, d] = base.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return getLocalDateString(dt);
}

function dateParts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return {
    weekday: dt.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
    day: dt.getDate(),
    month: dt.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    long: dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }),
  };
}

/* ------------------------------------------------------------------ */
/* Seletor de dias                                                     */
/* ------------------------------------------------------------------ */
function DayStrip({
  today,
  selected,
  onSelect,
}: {
  today: string;
  selected: string;
  onSelect: (d: string) => void;
}) {
  const days = useMemo(
    () =>
      Array.from({ length: DAY_RANGE_BEFORE + DAY_RANGE_AFTER + 1 }, (_, i) =>
        shiftDate(today, i - DAY_RANGE_BEFORE)
      ),
    [today]
  );
  const outOfRange = !days.includes(selected);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
        {days.map((d) => {
          const p = dateParts(d);
          const active = d === selected;
          const isToday = d === today;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelect(d)}
              aria-pressed={active}
              className={`shrink-0 w-[52px] py-2 rounded-xl flex flex-col items-center transition-colors ${
                active
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
              }`}
            >
              <span className={`text-[10px] uppercase tracking-wide ${active ? "text-zinc-600" : "text-zinc-500"}`}>
                {isToday ? "Hoje" : p.weekday}
              </span>
              <span className="text-sm font-semibold tabular-nums">{p.day}</span>
            </button>
          );
        })}
      </div>

      {/* Data personalizada */}
      <label
        className={`relative shrink-0 h-[52px] px-3 rounded-xl flex items-center gap-2 text-xs cursor-pointer transition-colors border ${
          outOfRange
            ? "bg-zinc-100 text-zinc-900 border-transparent"
            : "border-white/[0.06] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]"
        }`}
        title="Escolher data"
      >
        <CalendarDays className="w-4 h-4" />
        {outOfRange && (
          <span className="font-medium tabular-nums">
            {dateParts(selected).day} {dateParts(selected).month}
          </span>
        )}
        <input
          type="date"
          value={selected}
          onChange={(e) => e.target.value && onSelect(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Escolher data"
        />
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chip de filtro                                                      */
/* ------------------------------------------------------------------ */
function FilterChip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-white/[0.1] text-white"
          : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`tabular-nums ${active ? "text-zinc-300" : "text-zinc-600"}`}>{count}</span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Grupo de partidas por campeonato                                    */
/* ------------------------------------------------------------------ */
interface LeagueGroup {
  key: string;
  name: string;
  logo?: string;
  matches: SportMatch[];
  liveCount: number;
}

function LeagueSection({
  group,
  fav,
  onSelect,
}: {
  group: LeagueGroup;
  fav: FavoriteLookup;
  onSelect: (m: SportMatch) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SportsPanel
      className="[content-visibility:auto] [contain-intrinsic-size:auto_320px]"
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        className="w-full flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors text-left"
      >
        {group.logo ? (
          <TeamLogo src={group.logo} name={group.name} size={18} />
        ) : (
          <Trophy className="w-4 h-4 text-zinc-500" />
        )}
        <span className="flex-1 text-[13px] font-semibold text-zinc-100 truncate">{group.name}</span>
        {group.liveCount > 0 && (
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-300/90">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {group.liveCount} ao vivo
          </span>
        )}
        <span className="text-[11px] text-zinc-500 tabular-nums">{group.matches.length}</span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>
      {!collapsed && (
        <div className="divide-y divide-white/[0.04]">
          {group.matches.map((m) => (
            <MatchRow key={m.id} match={m} isFavorite={isFavoriteMatch(m, fav)} onSelect={onSelect} />
          ))}
        </div>
      )}
    </SportsPanel>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */
export function SportsDashboard() {
  const today = useMemo(() => getLocalDateString(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<ViewFilter>("all");
  const [leagueFilter, setLeagueFilter] = useState<string>("ALL");
  const [selectedMatch, setSelectedMatch] = useState<SportMatch | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const isToday = selectedDate === today;
  const handleSelect = useCallback((m: SportMatch) => setSelectedMatch(m), []);
  const closeModal = useCallback(() => setSelectedMatch(null), []);

  /* Preferências */
  const { data: preferences, refetch: refetchPrefs } = useQuery<SportsUserPreferences>({
    queryKey: ["sports-preferences"],
    queryFn: sportsApi.getPreferences,
    staleTime: 1000 * 60 * 5,
  });

  const fav = useMemo<FavoriteLookup>(
    () => ({
      teamKeys: new Set(
        preferences?.trackedTeams?.map((t) => `${(t.sport || "").toLowerCase()}::${t.teamId}`) || []
      ),
      leagueSlugs: new Set(
        preferences?.trackedLeagues?.map((l) => normalizeLeagueSlug(l.league)) || []
      ),
    }),
    [preferences]
  );
  const favoritesCount =
    (preferences?.trackedTeams?.length || 0) + (preferences?.trackedLeagues?.length || 0);

  /* Jogos do dia — sempre todas as ligas; o filtro por liga é feito no cliente (troca instantânea). */
  const {
    data: dayMatches = [],
    isLoading: isLoadingDay,
    isFetching: isFetchingDay,
    refetch: refetchDay,
  } = useQuery<SportMatch[]>({
    queryKey: ["sports-day-matches", selectedDate, "ALL"],
    queryFn: () => sportsApi.getDayMatches(selectedDate, "ALL"),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
    refetchInterval: (q) => (q.state.data?.some((m) => isLiveStatus(m.status)) ? 30_000 : 120_000),
  });

  /* Ao vivo hoje — só busca separado quando o usuário está olhando outro dia. */
  const { data: todayMatches = [] } = useQuery<SportMatch[]>({
    queryKey: ["sports-day-matches", today, "ALL"],
    queryFn: () => sportsApi.getDayMatches(today, "ALL"),
    enabled: !isToday,
    staleTime: 1000 * 30,
    refetchInterval: 30_000,
  });

  const liveToday = useMemo(
    () => (isToday ? dayMatches : todayMatches).filter((m) => isLiveStatus(m.status)),
    [isToday, dayMatches, todayMatches]
  );

  /* Resultados recentes dos times favoritos */
  const trackedTeamsKey = preferences?.trackedTeams?.map((t) => t.teamId).join(",") || "";
  const {
    data: history = [],
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery<SportMatch[]>({
    queryKey: ["sports-history-matches", trackedTeamsKey],
    queryFn: async () => {
      const teams = (preferences?.trackedTeams || []).slice(0, 6);
      const results = await Promise.all(
        teams.map((t) => sportsApi.getTeamSchedule(t.sport, t.league, t.teamId).catch(() => []))
      );
      const map = new Map<string, SportMatch>();
      for (const list of results) {
        if (!Array.isArray(list)) continue;
        for (const m of list) if (isFinishedStatus(m.status)) map.set(m.id, m);
      }
      return Array.from(map.values())
        .sort((a, b) => matchTimestamp(b) - matchTimestamp(a))
        .slice(0, 15);
    },
    enabled: trackedTeamsKey.length > 0,
    staleTime: 1000 * 60 * 15,
  });

  /* Contagem de jogos por liga no dia */
  const leagueCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of dayMatches) {
      const k = normalizeLeagueSlug(m.league);
      map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  }, [dayMatches]);

  const dayLiveCount = useMemo(() => dayMatches.filter((m) => isLiveStatus(m.status)).length, [dayMatches]);
  const dayFavCount = useMemo(() => dayMatches.filter((m) => isFavoriteMatch(m, fav)).length, [dayMatches, fav]);

  /* Lista filtrada e agrupada */
  const groups = useMemo<LeagueGroup[]>(() => {
    let list = dayMatches;
    if (leagueFilter !== "ALL") list = list.filter((m) => normalizeLeagueSlug(m.league) === leagueFilter);
    if (view === "live") list = list.filter((m) => isLiveStatus(m.status));
    if (view === "favorites") list = list.filter((m) => isFavoriteMatch(m, fav));

    const map = new Map<string, LeagueGroup>();
    for (const m of list) {
      const key = normalizeLeagueSlug(m.league) || "outros";
      if (!map.has(key)) {
        const def = findLeague(key);
        map.set(key, {
          key,
          name: translateLeagueName(m.leagueName, m.league) || def?.name || "Outros",
          logo: def?.logoUrl,
          matches: [],
          liveCount: 0,
        });
      }
      const g = map.get(key)!;
      g.matches.push(m);
      if (isLiveStatus(m.status)) g.liveCount++;
    }

    const order = (k: string) => {
      const i = SUPPORTED_LEAGUES.findIndex((l) => l.slug === k);
      return i === -1 ? 999 : i;
    };
    const rank = (m: SportMatch) => (isLiveStatus(m.status) ? 0 : isFinishedStatus(m.status) ? 2 : 1);

    return Array.from(map.values())
      .map((g) => ({
        ...g,
        matches: [...g.matches].sort(
          (a, b) => rank(a) - rank(b) || matchTimestamp(a) - matchTimestamp(b)
        ),
      }))
      // Ligas com jogos ao vivo e favoritas primeiro, depois a ordem padrão
      .sort(
        (a, b) =>
          Number(b.liveCount > 0) - Number(a.liveCount > 0) ||
          Number(fav.leagueSlugs.has(b.key)) - Number(fav.leagueSlugs.has(a.key)) ||
          order(a.key) - order(b.key)
      );
  }, [dayMatches, leagueFilter, view, fav]);

  const visibleCount = groups.reduce((acc, g) => acc + g.matches.length, 0);
  const leaguesWithGames = SUPPORTED_LEAGUES.filter(
    (l) => (leagueCounts.get(l.slug) || 0) > 0 || l.slug === leagueFilter
  );

  const handleRefresh = () => {
    refetchDay();
    refetchPrefs();
    refetchHistory();
  };

  const changeDate = (d: string) => {
    setSelectedDate(d);
    if (view === "live" && d !== today) setView("all");
  };

  const historyVisible = showAllHistory ? history : history.slice(0, 5);
  const dateInfo = dateParts(selectedDate);

  return (
    <div className="space-y-6">
      {/* ============ CABEÇALHO ============ */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1 capitalize">
            {isToday ? "Hoje · " : ""}
            {dateInfo.long}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Esportes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isLoadingDay ? (
              "Carregando partidas…"
            ) : (
              <>
                {dayMatches.length} {dayMatches.length === 1 ? "jogo" : "jogos"}
                {dayLiveCount > 0 && (
                  <span className="text-emerald-300/90"> · {dayLiveCount} ao vivo</span>
                )}
                {dayFavCount > 0 && <span> · {dayFavCount} dos seus favoritos</span>}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetchingDay}
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors disabled:opacity-60"
            title="Atualizar"
            aria-label="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingDay ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/sports/favoritos"
            className="h-9 px-3.5 inline-flex items-center gap-2 rounded-xl border border-white/[0.06] text-sm text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            <span>Favoritos</span>
            {favoritesCount > 0 && (
              <span className="text-xs text-zinc-500 tabular-nums">{favoritesCount}</span>
            )}
          </Link>
        </div>
      </header>

      {/* ============ DIAS ============ */}
      <DayStrip today={today} selected={selectedDate} onSelect={changeDate} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============ COLUNA PRINCIPAL ============ */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          {/* Filtros */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-white/[0.06] pb-3">
            <FilterChip active={view === "all"} onClick={() => setView("all")}>
              Todos
            </FilterChip>
            {isToday && dayLiveCount > 0 && (
              <FilterChip active={view === "live"} onClick={() => setView("live")} count={dayLiveCount}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Ao vivo
              </FilterChip>
            )}
            <FilterChip
              active={view === "favorites"}
              onClick={() => setView("favorites")}
              count={dayFavCount}
            >
              <Star className="w-3.5 h-3.5" />
              Favoritos
            </FilterChip>

            {leaguesWithGames.length > 0 && <span className="w-px h-5 bg-white/[0.08] mx-2 shrink-0" />}

            {leaguesWithGames.length > 1 && (
              <FilterChip active={leagueFilter === "ALL"} onClick={() => setLeagueFilter("ALL")}>
                Todas as ligas
              </FilterChip>
            )}
            {leaguesWithGames.map((l) => (
              <FilterChip
                key={l.slug}
                active={leagueFilter === l.slug}
                onClick={() => setLeagueFilter(leagueFilter === l.slug ? "ALL" : l.slug)}
                count={leagueCounts.get(l.slug) || 0}
              >
                {l.logoUrl && <TeamLogo src={l.logoUrl} name={l.abbreviation || l.name} size={14} />}
                {l.abbreviation || l.name}
              </FilterChip>
            ))}
          </div>

          {/* Lista */}
          {isLoadingDay ? (
            <SportsPanel>
              <RowSkeleton rows={6} />
            </SportsPanel>
          ) : visibleCount === 0 ? (
            <SportsPanel>
              <PanelEmpty
                icon={<Trophy className="w-8 h-8" />}
                title={
                  view === "favorites"
                    ? "Nenhum jogo dos seus favoritos nesta data"
                    : view === "live"
                    ? "Nenhum jogo ao vivo agora"
                    : "Nenhum jogo nesta data"
                }
                description={
                  view !== "all" || leagueFilter !== "ALL"
                    ? "Tente remover os filtros ou escolher outro dia."
                    : "Escolha outro dia no calendário acima."
                }
                action={
                  view !== "all" || leagueFilter !== "ALL" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setView("all");
                        setLeagueFilter("ALL");
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 transition-colors"
                    >
                      Limpar filtros
                    </button>
                  ) : undefined
                }
              />
            </SportsPanel>
          ) : (
            <div className={`space-y-4 transition-opacity ${isFetchingDay && !isLoadingDay ? "opacity-70" : ""}`}>
              {groups.map((g) => (
                <LeagueSection key={g.key} group={g} fav={fav} onSelect={handleSelect} />
              ))}
            </div>
          )}
        </div>

        {/* ============ COLUNA LATERAL ============ */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
          {/* Ao vivo hoje (quando navegando em outro dia) */}
          {!isToday && liveToday.length > 0 && (
            <SportsPanel
              title={
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ao vivo agora
                </span>
              }
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(today);
                    setView("live");
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  Ver todos
                </button>
              }
            >
              <div className="divide-y divide-white/[0.04]">
                {liveToday.slice(0, 4).map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    showLeague
                    isFavorite={isFavoriteMatch(m, fav)}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </SportsPanel>
          )}

          <SportsRadar onSelectMatch={handleSelect} />

          <SportsPanel title="Resultados recentes" icon={<History className="w-4 h-4" />}>
            {!preferences?.trackedTeams?.length ? (
              <PanelEmpty
                title="Sem times favoritos"
                description="Adicione seus clubes para acompanhar os últimos placares aqui."
                action={
                  <Link
                    href="/sports/favoritos"
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 transition-colors"
                  >
                    Escolher times
                  </Link>
                }
              />
            ) : isLoadingHistory ? (
              <RowSkeleton rows={3} />
            ) : history.length === 0 ? (
              <PanelEmpty title="Nenhum resultado recente" />
            ) : (
              <>
                <div className="divide-y divide-white/[0.04]">
                  {historyVisible.map((m) => (
                    <MatchRow key={m.id} match={m} showDate showLeague onSelect={handleSelect} />
                  ))}
                </div>
                {history.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllHistory((v) => !v)}
                    className="w-full px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03] border-t border-white/[0.05] transition-colors"
                  >
                    {showAllHistory ? "Mostrar menos" : `Mostrar mais ${history.length - 5}`}
                  </button>
                )}
              </>
            )}
          </SportsPanel>
        </aside>
      </div>

      {selectedMatch && (
        <Suspense fallback={null}>
          <MatchDetailModal
            match={selectedMatch}
            isOpen
            onClose={closeModal}
          />
        </Suspense>
      )}
    </div>
  );
}
