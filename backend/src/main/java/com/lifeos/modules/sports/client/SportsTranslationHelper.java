package com.lifeos.modules.sports.client;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility helper to localize ESPN sports API metadata into Portuguese.
 * Translates competition names, national team names, match statuses and descriptions.
 */
public final class SportsTranslationHelper {

    private SportsTranslationHelper() {}

    private static final Map<String, String> LEAGUE_TRANSLATIONS;
    private static final Map<String, String> COUNTRY_TEAM_TRANSLATIONS;
    private static final Map<String, String> STATUS_TRANSLATIONS;

    static {
        Map<String, String> leagues = new HashMap<>();
        // Friendlies & International tournaments
        leagues.put("international friendly", "Amistosos Internacionais");
        leagues.put("international friendlies", "Amistosos Internacionais");
        leagues.put("fifa friendlies", "Amistosos Internacionais");
        leagues.put("men's international friendly", "Amistosos Internacionais");
        leagues.put("women's international friendly", "Amistosos Femininos");
        leagues.put("club friendly", "Amistosos de Clubes");
        leagues.put("club friendlies", "Amistosos de Clubes");

        // Domestic & Continental tournaments
        leagues.put("brazilian serie a", "Brasileirão Série A");
        leagues.put("brazil serie a", "Brasileirão Série A");
        leagues.put("bra.1", "Brasileirão Série A");
        leagues.put("brazilian serie b", "Brasileirão Série B");
        leagues.put("brazil serie b", "Brasileirão Série B");
        leagues.put("brazilian copa do brasil", "Copa do Brasil");
        leagues.put("bra.copa_do_brazil", "Copa do Brasil");
        leagues.put("copa do brazil", "Copa do Brasil");
        leagues.put("copa do brasil", "Copa do Brasil");

        leagues.put("conmebol libertadores", "Copa Libertadores");
        leagues.put("copa libertadores", "Copa Libertadores");
        leagues.put("conmebol.libertadores", "Copa Libertadores");
        leagues.put("conmebol sudamericana", "Copa Sul-Americana");
        leagues.put("copa sudamericana", "Copa Sul-Americana");
        leagues.put("conmebol recopa", "Recopa Sul-Americana");

        leagues.put("uefa champions league", "UEFA Champions League");
        leagues.put("uefa.champions", "UEFA Champions League");
        leagues.put("uefa europa league", "UEFA Europa League");
        leagues.put("uefa conference league", "UEFA Conference League");
        leagues.put("uefa europa conference league", "UEFA Conference League");
        leagues.put("uefa nations league", "Liga das Nações da UEFA");
        leagues.put("uefa european championship", "Eurocopa");
        leagues.put("uefa euro", "Eurocopa");
        leagues.put("european championship", "Eurocopa");

        leagues.put("english premier league", "Premier League");
        leagues.put("premier league", "Premier League");
        leagues.put("english fa cup", "Copa da Inglaterra (FA Cup)");
        leagues.put("fa cup", "Copa da Inglaterra");
        leagues.put("english carabao cup", "Copa da Liga Inglesa");
        leagues.put("carabao cup", "Copa da Liga Inglesa");

        leagues.put("spanish laliga", "La Liga");
        leagues.put("spanish la liga", "La Liga");
        leagues.put("laliga", "La Liga");
        leagues.put("la liga", "La Liga");
        leagues.put("spanish copa del rey", "Copa do Rei");
        leagues.put("copa del rey", "Copa do Rei");

        leagues.put("italian serie a", "Serie A Italiana");
        leagues.put("italian coppa italia", "Copa da Itália");
        leagues.put("coppa italia", "Copa da Itália");

        leagues.put("german bundesliga", "Bundesliga");
        leagues.put("bundesliga", "Bundesliga");
        leagues.put("german dfb-pokal", "Copa da Alemanha");
        leagues.put("dfb-pokal", "Copa da Alemanha");

        leagues.put("french ligue 1", "Ligue 1");
        leagues.put("ligue 1", "Ligue 1");
        leagues.put("french coupe de france", "Copa da França");
        leagues.put("coupe de france", "Copa da França");

        leagues.put("fifa world cup", "Copa do Mundo FIFA");
        leagues.put("fifa.world", "Copa do Mundo FIFA");
        leagues.put("fifa world cup qualifying", "Eliminatórias da Copa do Mundo");
        leagues.put("fifa world cup qualifying - conmebol", "Eliminatórias da Copa (CONMEBOL)");
        leagues.put("fifa world cup qualifying - uefa", "Eliminatórias da Copa (UEFA)");
        leagues.put("fifa club world cup", "Mundial de Clubes FIFA");
        leagues.put("fifa women's world cup", "Copa do Mundo Feminina");
        leagues.put("fifa.wwc", "Copa do Mundo Feminina");
        leagues.put("fifa.friendly", "Amistosos Internacionais");
        leagues.put("national basketball association", "NBA");
        leagues.put("nba", "NBA");
        leagues.put("national football league", "NFL");
        leagues.put("nfl", "NFL");

        LEAGUE_TRANSLATIONS = Collections.unmodifiableMap(leagues);

        // National Teams / Countries (ESPN returns English names like "Brazil", "Germany", etc.)
        Map<String, String> countries = new HashMap<>();
        countries.put("brazil", "Brasil");
        countries.put("argentina", "Argentina");
        countries.put("germany", "Alemanha");
        countries.put("france", "França");
        countries.put("spain", "Espanha");
        countries.put("italy", "Itália");
        countries.put("england", "Inglaterra");
        countries.put("portugal", "Portugal");
        countries.put("netherlands", "Holanda");
        countries.put("holland", "Holanda");
        countries.put("belgium", "Bélgica");
        countries.put("croatia", "Croácia");
        countries.put("uruguay", "Uruguai");
        countries.put("colombia", "Colômbia");
        countries.put("chile", "Chile");
        countries.put("paraguay", "Paraguai");
        countries.put("ecuador", "Equador");
        countries.put("peru", "Peru");
        countries.put("bolivia", "Bolívia");
        countries.put("venezuela", "Venezuela");
        countries.put("united states", "Estados Unidos");
        countries.put("usa", "Estados Unidos");
        countries.put("mexico", "México");
        countries.put("canada", "Canadá");
        countries.put("japan", "Japão");
        countries.put("south korea", "Coreia do Sul");
        countries.put("korea republic", "Coreia do Sul");
        countries.put("north korea", "Coreia do Norte");
        countries.put("morocco", "Marrocos");
        countries.put("senegal", "Senegal");
        countries.put("nigeria", "Nigéria");
        countries.put("egypt", "Egito");
        countries.put("cameroon", "Camarões");
        countries.put("ivory coast", "Costa do Marfim");
        countries.put("côte d'ivoire", "Costa do Marfim");
        countries.put("ghana", "Gana");
        countries.put("algeria", "Argélia");
        countries.put("south africa", "África do Sul");
        countries.put("tunisia", "Tunísia");
        countries.put("saudi arabia", "Arábia Saudita");
        countries.put("australia", "Austrália");
        countries.put("new zealand", "Nova Zelândia");
        countries.put("switzerland", "Suíça");
        countries.put("sweden", "Suécia");
        countries.put("denmark", "Dinamarca");
        countries.put("norway", "Noruega");
        countries.put("poland", "Polônia");
        countries.put("austria", "Áustria");
        countries.put("turkey", "Turquia");
        countries.put("türkiye", "Turquia");
        countries.put("ukraine", "Ucrânia");
        countries.put("scotland", "Escócia");
        countries.put("wales", "País de Gales");
        countries.put("republic of ireland", "Irlanda");
        countries.put("ireland", "Irlanda");
        countries.put("northern ireland", "Irlanda do Norte");
        countries.put("czech republic", "República Tcheca");
        countries.put("czechia", "República Tcheca");
        countries.put("greece", "Grécia");
        countries.put("romania", "Romênia");
        countries.put("hungary", "Hungria");
        countries.put("serbia", "Sérvia");
        countries.put("slovakia", "Eslováquia");
        countries.put("slovenia", "Eslovênia");
        countries.put("finland", "Finlândia");
        countries.put("iceland", "Islândia");
        countries.put("russia", "Rússia");
        countries.put("china pr", "China");
        countries.put("china", "China");
        countries.put("qatar", "Catar");
        countries.put("united arab emirates", "Emirados Árabes Unidos");
        countries.put("uae", "Emirados Árabes");
        countries.put("panama", "Panamá");
        countries.put("costa rica", "Costa Rica");
        countries.put("jamaica", "Jamaica");
        countries.put("honduras", "Honduras");
        countries.put("guatemala", "Guatemala");
        countries.put("el salvador", "El Salvador");
        countries.put("iran", "Irã");
        countries.put("iraq", "Iraque");
        countries.put("israel", "Israel");

        COUNTRY_TEAM_TRANSLATIONS = Collections.unmodifiableMap(countries);

        // Status details
        Map<String, String> statuses = new HashMap<>();
        statuses.put("full time", "Finalizado");
        statuses.put("ft", "Finalizado");
        statuses.put("final", "Finalizado");
        statuses.put("half time", "Intervalo");
        statuses.put("halftime", "Intervalo");
        statuses.put("ht", "Intervalo");
        statuses.put("1st half", "1º Tempo");
        statuses.put("2nd half", "2º Tempo");
        statuses.put("extra time", "Prorrogação");
        statuses.put("et", "Prorrogação");
        statuses.put("penalties", "Pênaltis");
        statuses.put("penalty shootout", "Pênaltis");
        statuses.put("shootout", "Pênaltis");
        statuses.put("postponed", "Adiado");
        statuses.put("canceled", "Cancelado");
        statuses.put("cancelled", "Cancelado");
        statuses.put("delayed", "Atrasado");
        statuses.put("suspended", "Suspenso");
        statuses.put("end of 1st", "Fim do 1º Qtr");
        statuses.put("end of 2nd", "Fim do 2º Qtr");
        statuses.put("end of 3rd", "Fim do 3º Qtr");
        statuses.put("end of 4th", "Fim do 4º Qtr");
        statuses.put("1st qtr", "1º Quarto");
        statuses.put("2nd qtr", "2º Quarto");
        statuses.put("3rd qtr", "3º Quarto");
        statuses.put("4th qtr", "4º Quarto");
        statuses.put("ot", "Prorrogação");
        statuses.put("overtime", "Prorrogação");

        STATUS_TRANSLATIONS = Collections.unmodifiableMap(statuses);
    }

    public static String translateLeagueName(String leagueName) {
        if (leagueName == null || leagueName.isBlank()) {
            return leagueName;
        }
        String lower = leagueName.trim().toLowerCase();
        if (LEAGUE_TRANSLATIONS.containsKey(lower)) {
            return LEAGUE_TRANSLATIONS.get(lower);
        }
        // Partial checks
        if (lower.contains("champions")) {
            return "UEFA Champions League";
        }
        if (lower.contains("friendly") || lower.contains("friendlies") || lower.contains("amistoso")) {
            return "Amistosos Internacionais";
        }
        if (lower.contains("serie a") && (lower.contains("brazil") || lower.contains("brazilian") || lower.contains("brasil"))) {
            return "Brasileirão Série A";
        }
        if (lower.equals("bra.1") || lower.startsWith("bra.1")) {
            return "Brasileirão Série A";
        }
        if (lower.contains("copa do brasil") || lower.contains("copa do brazil") || lower.contains("copa_do_brazil")) {
            return "Copa do Brasil";
        }
        if (lower.contains("libertadores")) {
            return "Copa Libertadores";
        }
        if (lower.contains("sudamericana") || lower.contains("sul-americana")) {
            return "Copa Sul-Americana";
        }
        if (lower.equals("nba")) {
            return "NBA";
        }
        if (lower.equals("nfl")) {
            return "NFL";
        }
        return leagueName;
    }

    public static String translateTeamName(String teamName) {
        if (teamName == null || teamName.isBlank()) {
            return teamName;
        }
        String lower = teamName.trim().toLowerCase();
        if (COUNTRY_TEAM_TRANSLATIONS.containsKey(lower)) {
            return COUNTRY_TEAM_TRANSLATIONS.get(lower);
        }
        return teamName;
    }

    public static String translateStatusDetail(String detail) {
        if (detail == null || detail.isBlank()) {
            return detail;
        }
        String lower = detail.trim().toLowerCase();
        if (STATUS_TRANSLATIONS.containsKey(lower)) {
            return STATUS_TRANSLATIONS.get(lower);
        }
        // Check partials
        if (lower.startsWith("full time") || lower.equals("ft") || lower.startsWith("final")) {
            return "Finalizado";
        }
        if (lower.startsWith("half time") || lower.equals("ht") || lower.startsWith("halftime")) {
            return "Intervalo";
        }
        return detail;
    }

    public static String translateMatchName(String matchName) {
        if (matchName == null || matchName.isBlank()) {
            return matchName;
        }
        // e.g. "Brazil at Argentina" -> "Brasil vs Argentina"
        String separator = null;
        if (matchName.contains(" at ")) {
            separator = " at ";
        } else if (matchName.contains(" vs ")) {
            separator = " vs ";
        } else if (matchName.contains(" vs. ")) {
            separator = " vs. ";
        }

        if (separator != null) {
            String[] parts = matchName.split(separator, 2);
            if (parts.length == 2) {
                String team1 = translateTeamName(parts[0].trim());
                String team2 = translateTeamName(parts[1].trim());
                return team1 + " vs " + team2;
            }
        }
        return matchName;
    }
}
