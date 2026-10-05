import { SportMatch, TeamCompetitor } from "./types";

/**
 * Dicionários de tradução e localização para a API esportiva (ESPN) em Português.
 */

export const LEAGUE_NAME_TRANSLATIONS: Record<string, string> = {
  // Amistosos & Torneios Internacionais
  "international friendly": "Amistosos Internacionais",
  "international friendlies": "Amistosos Internacionais",
  "fifa friendlies": "Amistosos Internacionais",
  "men's international friendly": "Amistosos Internacionais",
  "women's international friendly": "Amistosos Femininos",
  "club friendly": "Amistosos de Clubes",
  "club friendlies": "Amistosos de Clubes",
  "fifa.friendly": "Amistosos Internacionais",

  // Campeonatos Nacionais & Continentais
  "brazilian serie a": "Brasileirão Série A",
  "brazil serie a": "Brasileirão Série A",
  "bra.1": "Brasileirão Série A",
  "brazilian serie b": "Brasileirão Série B",
  "brazil serie b": "Brasileirão Série B",
  "bra.copa_do_brazil": "Copa do Brasil",
  "brazilian copa do brasil": "Copa do Brasil",
  "copa do brazil": "Copa do Brasil",
  "copa do brasil": "Copa do Brasil",

  "conmebol libertadores": "Copa Libertadores",
  "copa libertadores": "Copa Libertadores",
  "conmebol.libertadores": "Copa Libertadores",
  "conmebol sudamericana": "Copa Sul-Americana",
  "copa sudamericana": "Copa Sul-Americana",
  "conmebol recopa": "Recopa Sul-Americana",

  "uefa champions league": "UEFA Champions League",
  "uefa.champions": "UEFA Champions League",
  "uefa europa league": "UEFA Europa League",
  "uefa conference league": "UEFA Conference League",
  "uefa europa conference league": "UEFA Conference League",
  "uefa nations league": "Liga das Nações da UEFA",
  "uefa european championship": "Eurocopa",
  "uefa euro": "Eurocopa",
  "european championship": "Eurocopa",

  "english premier league": "Premier League",
  "premier league": "Premier League",
  "english fa cup": "Copa da Inglaterra",
  "fa cup": "Copa da Inglaterra",
  "english carabao cup": "Copa da Liga Inglesa",
  "carabao cup": "Copa da Liga Inglesa",

  "spanish laliga": "La Liga",
  "spanish la liga": "La Liga",
  "laliga": "La Liga",
  "la liga": "La Liga",
  "spanish copa del rey": "Copa do Rei",
  "copa del rey": "Copa do Rei",

  "italian serie a": "Serie A Italiana",
  "italian coppa italia": "Copa da Itália",
  "coppa italia": "Copa da Itália",

  "german bundesliga": "Bundesliga",
  "bundesliga": "Bundesliga",
  "german dfb-pokal": "Copa da Alemanha",
  "dfb-pokal": "Copa da Alemanha",

  "french ligue 1": "Ligue 1",
  "ligue 1": "Ligue 1",
  "french coupe de france": "Copa da França",
  "coupe de france": "Copa da França",

  "fifa world cup": "Copa do Mundo FIFA",
  "fifa.world": "Copa do Mundo FIFA",
  "fifa world cup qualifying": "Eliminatórias da Copa",
  "fifa world cup qualifying - conmebol": "Eliminatórias da Copa (CONMEBOL)",
  "fifa world cup qualifying - uefa": "Eliminatórias da Copa (UEFA)",
  "fifa club world cup": "Mundial de Clubes FIFA",
  "fifa women's world cup": "Copa do Mundo Feminina",
  "fifa.wwc": "Copa do Mundo Feminina",

  "national basketball association": "NBA",
  "nba": "NBA",
  "national football league": "NFL",
  "nfl": "NFL",
};

export const COUNTRY_TEAM_TRANSLATIONS: Record<string, string> = {
  // Américas
  brazil: "Brasil",
  argentina: "Argentina",
  uruguay: "Uruguai",
  colombia: "Colômbia",
  chile: "Chile",
  paraguay: "Paraguai",
  ecuador: "Equador",
  peru: "Peru",
  bolivia: "Bolívia",
  venezuela: "Venezuela",
  "united states": "Estados Unidos",
  usa: "Estados Unidos",
  mexico: "México",
  canada: "Canadá",
  panama: "Panamá",
  "costa rica": "Costa Rica",
  jamaica: "Jamaica",
  honduras: "Honduras",
  guatemala: "Guatemala",
  "el salvador": "El Salvador",

  // Europa
  germany: "Alemanha",
  france: "França",
  spain: "Espanha",
  italy: "Itália",
  england: "Inglaterra",
  portugal: "Portugal",
  netherlands: "Holanda",
  holland: "Holanda",
  belgium: "Bélgica",
  croatia: "Croácia",
  switzerland: "Suíça",
  sweden: "Suécia",
  denmark: "Dinamarca",
  norway: "Noruega",
  poland: "Polônia",
  austria: "Áustria",
  turkey: "Turquia",
  türkiye: "Turquia",
  ukraine: "Ucrânia",
  scotland: "Escócia",
  wales: "País de Gales",
  "republic of ireland": "Irlanda",
  ireland: "Irlanda",
  "northern ireland": "Irlanda do Norte",
  "czech republic": "República Tcheca",
  czechia: "República Tcheca",
  greece: "Grécia",
  romania: "Romênia",
  hungary: "Hungria",
  serbia: "Sérvia",
  slovakia: "Eslováquia",
  slovenia: "Eslovênia",
  finland: "Finlândia",
  iceland: "Islândia",
  russia: "Rússia",

  // Ásia / Oceania
  japan: "Japão",
  "south korea": "Coreia do Sul",
  "korea republic": "Coreia do Sul",
  "north korea": "Coreia do Norte",
  australia: "Austrália",
  "new zealand": "Nova Zelândia",
  "saudi arabia": "Arábia Saudita",
  qatar: "Catar",
  "united arab emirates": "Emirados Árabes Unidos",
  uae: "Emirados Árabes",
  "china pr": "China",
  china: "China",
  iran: "Irã",
  iraq: "Iraque",
  israel: "Israel",

  // África
  morocco: "Marrocos",
  senegal: "Senegal",
  nigeria: "Nigéria",
  egypt: "Egito",
  cameroon: "Camarões",
  "ivory coast": "Costa do Marfim",
  "côte d'ivoire": "Costa do Marfim",
  ghana: "Gana",
  algeria: "Argélia",
  "south africa": "África do Sul",
  tunisia: "Tunísia",
};

export const STATUS_DETAIL_TRANSLATIONS: Record<string, string> = {
  "full time": "Finalizado",
  ft: "Finalizado",
  final: "Finalizado",
  completed: "Finalizado",
  "half time": "Intervalo",
  halftime: "Intervalo",
  ht: "Intervalo",
  "1st half": "1º Tempo",
  "2nd half": "2º Tempo",
  "first half": "1º Tempo",
  "second half": "2º Tempo",
  "extra time": "Prorrogação",
  et: "Prorrogação",
  penalties: "Pênaltis",
  "penalty shootout": "Pênaltis",
  shootout: "Pênaltis",
  postponed: "Adiado",
  canceled: "Cancelado",
  cancelled: "Cancelado",
  delayed: "Atrasado",
  suspended: "Suspenso",
  scheduled: "Agendado",
  "end of 1st": "Fim do 1º Qtr",
  "end of 2nd": "Fim do 2º Qtr",
  "end of 3rd": "Fim do 3º Qtr",
  "end of 4th": "Fim do 4º Qtr",
  "1st qtr": "1º Quarto",
  "2nd qtr": "2º Quarto",
  "3rd qtr": "3º Quarto",
  "4th qtr": "4º Quarto",
  ot: "Prorrogação",
  overtime: "Prorrogação",
};

/**
 * Traduz o nome da competição ou liga.
 */
export function translateLeagueName(rawName?: string, leagueSlug?: string): string {
  if (!rawName && !leagueSlug) return "Outras Competições";

  const key = (rawName || leagueSlug || "").trim().toLowerCase();
  if (LEAGUE_NAME_TRANSLATIONS[key]) {
    return LEAGUE_NAME_TRANSLATIONS[key];
  }

  // Verifica pelo slug se fornecido
  if (leagueSlug) {
    const slugKey = leagueSlug.trim().toLowerCase();
    if (LEAGUE_NAME_TRANSLATIONS[slugKey]) {
      return LEAGUE_NAME_TRANSLATIONS[slugKey];
    }
  }

  // Comparações parciais inteligentes
  if (key.includes("friendly") || key.includes("friendlies") || key.includes("amistoso")) {
    return "Amistosos Internacionais";
  }
  if (key.includes("serie a") && (key.includes("brazil") || key.includes("brazilian") || key.includes("brasil"))) {
    return "Brasileirão Série A";
  }
  if (key.includes("copa do brasil") || key.includes("copa do brazil")) {
    return "Copa do Brasil";
  }
  if (key.includes("libertadores")) {
    return "Copa Libertadores";
  }
  if (key.includes("sudamericana") || key.includes("sul-americana")) {
    return "Copa Sul-Americana";
  }
  if (key.includes("champions")) {
    return "UEFA Champions League";
  }

  return rawName || leagueSlug || "Competição";
}

/**
 * Traduz nomes de seleções ou clubes internacionais (ex: Brazil -> Brasil).
 */
export function translateTeamName(rawName?: string): string {
  if (!rawName) return "";
  const key = rawName.trim().toLowerCase();
  if (COUNTRY_TEAM_TRANSLATIONS[key]) {
    return COUNTRY_TEAM_TRANSLATIONS[key];
  }
  return rawName;
}

/**
 * Traduz detalhes de status (ex: "Half Time" -> "Intervalo", "Full Time" -> "Finalizado").
 */
export function translateStatusDetail(detail?: string, status?: string): string {
  if (!detail && !status) return "";
  const key = (detail || status || "").trim().toLowerCase();

  if (STATUS_DETAIL_TRANSLATIONS[key]) {
    return STATUS_DETAIL_TRANSLATIONS[key];
  }

  // Parciais
  if (key.startsWith("full time") || key.startsWith("final") || key === "ft") {
    return "Finalizado";
  }
  if (key.startsWith("half time") || key.startsWith("halftime") || key === "ht") {
    return "Intervalo";
  }
  if (key.includes("postponed")) {
    return "Adiado";
  }
  if (key.includes("cancel")) {
    return "Cancelado";
  }
  if (key.includes("1st half") || key.includes("first half")) {
    return "1º Tempo";
  }
  if (key.includes("2nd half") || key.includes("second half")) {
    return "2º Tempo";
  }

  return detail || status || "";
}

/**
 * Traduz o nome da partida (ex: "Brazil at Argentina" -> "Brasil vs Argentina").
 */
export function translateMatchName(name?: string): string {
  if (!name) return "";
  const separator = name.includes(" at ")
    ? " at "
    : name.includes(" vs ")
    ? " vs "
    : name.includes(" vs. ")
    ? " vs. "
    : null;

  if (separator) {
    const [t1, t2] = name.split(separator);
    return `${translateTeamName(t1?.trim())} vs ${translateTeamName(t2?.trim())}`;
  }

  return name;
}

/**
 * Retorna uma cópia do objeto SportMatch completamente traduzida para Português.
 */
export function translateMatch(match: SportMatch): SportMatch {
  if (!match) return match;

  const translatedLeague = translateLeagueName(match.leagueName, match.league);

  const homeTeam: TeamCompetitor = match.homeTeam
    ? {
        ...match.homeTeam,
        displayName: translateTeamName(match.homeTeam.displayName || match.homeTeam.name),
        name: translateTeamName(match.homeTeam.name || match.homeTeam.displayName),
      }
    : match.homeTeam;

  const awayTeam: TeamCompetitor = match.awayTeam
    ? {
        ...match.awayTeam,
        displayName: translateTeamName(match.awayTeam.displayName || match.awayTeam.name),
        name: translateTeamName(match.awayTeam.name || match.awayTeam.displayName),
      }
    : match.awayTeam;

  const translatedDetail = translateStatusDetail(match.statusDetail, match.status);
  const translatedName = translateMatchName(match.name);

  return {
    ...match,
    leagueName: translatedLeague,
    name: translatedName,
    statusDetail: translatedDetail,
    homeTeam,
    awayTeam,
  };
}

export const STAT_LABEL_TRANSLATIONS: Record<string, string> = {
  // Futebol
  possession: "Posse de Bola",
  possessionpct: "Posse de Bola",
  shots: "Finalizações",
  "shots on goal": "Chutes no Alvo",
  "on goal": "Chutes no Alvo",
  fouls: "Faltas",
  foulscommitted: "Faltas Cometidas",
  "yellow cards": "Cartões Amarelos",
  yellowcards: "Cartões Amarelos",
  "red cards": "Cartões Vermelhos",
  redcards: "Cartões Vermelhos",
  offsides: "Impedimentos",
  "corner kicks": "Escanteios",
  woncorners: "Escanteios",
  saves: "Defesas",
  passes: "Passes Totais",
  "accurate passes": "Passes Certos",
  "pass completion %": "Precisão de Passes",
  "cross %": "Precisão de Cruzamentos",
  tackles: "Desarmes",
  "effective tackles": "Desarmes Certos",
  interceptions: "Interceptações",

  // Basquete (NBA)
  "field goal %": "Arremessos de Quadra %",
  fieldgoalspercentage: "Arremessos de Quadra %",
  "three point %": "Bolas de 3 Pontos %",
  threepointpercentage: "Bolas de 3 Pontos %",
  "free throw %": "Lances Livres %",
  freethrowspercentage: "Lances Livres %",
  rebounds: "Rebotes Totais",
  totalrebounds: "Rebotes Totais",
  "offensive rebounds": "Rebotes Ofensivos",
  "defensive rebounds": "Rebotes Defensivos",
  assists: "Assistências",
  steals: "Roubos de Bola",
  blocks: "Tocos",
  turnovers: "Erros (Turnovers)",
  totalturnovers: "Erros (Turnovers)",
  "points in paint": "Pontos no Garrafão",
  "fast break points": "Pontos em Contra-Ataque",
  points: "Pontos",
};

export function translateStatLabel(rawLabel?: string): string {
  if (!rawLabel) return "";
  const key = rawLabel.trim().toLowerCase();
  return STAT_LABEL_TRANSLATIONS[key] || rawLabel;
}

