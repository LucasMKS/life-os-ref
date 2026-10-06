package com.lifeos.modules.weather.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.lifeos.shared.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@Slf4j
@RequiredArgsConstructor
public class RoutineWeatherService {

    private final WebClient openWeatherWebClient;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final AtomicBoolean runningMorningWeather = new AtomicBoolean(false);

    @Value("${app.api-keys.openweathermap:}")
    private String apiKey;

    private final List<String> targetCities = Arrays.asList("Contagem,BR");

    // Disparado dinamicamente pelo DynamicNotificationScheduler de acordo com o horário do usuário
    @SchedulerLock(name = "weather-morningRoutine", lockAtMostFor = "PT15M", lockAtLeastFor = "PT5M")
    public void checkMorningRoutineWeather() {
        if (!runningMorningWeather.compareAndSet(false, true)) {
            log.warn("Scheduler de weather matinal ainda em execucao. Ciclo sera ignorado.");
            return;
        }

        try {
            log.info("Verificando previsão do tempo para a rotina matinal: {}", targetCities);

            for (String city : targetCities) {
                try {
                    String response = openWeatherWebClient.get()
                            .uri(uriBuilder -> uriBuilder.path("/forecast")
                                    .queryParam("q", city)
                                    .queryParam("units", "metric")
                                    .queryParam("lang", "pt_br")
                                    .queryParam("appid", apiKey)
                                    .build())
                            .retrieve()
                            .bodyToMono(String.class)
                            .block();

                    if (response == null) continue;

                    JsonNode root = objectMapper.readTree(response);
                    JsonNode list = root.path("list");
                    String cityName = root.path("city").path("name").asText();

                    boolean willRainSoon = false;
                    String rainTime = "";
                    String description = "";
                    double temp = 0.0;

                    for (int i = 0; i < 2; i++) {
                        JsonNode forecast = list.get(i);
                        JsonNode weatherNode = forecast.path("weather").get(0);
                        String mainCondition = weatherNode.path("main").asText();

                        if ("Rain".equalsIgnoreCase(mainCondition) ||
                                "Drizzle".equalsIgnoreCase(mainCondition) ||
                                "Thunderstorm".equalsIgnoreCase(mainCondition)) {

                            willRainSoon = true;
                            rainTime = forecast.path("dt_txt").asText().substring(11, 16);
                            description = weatherNode.path("description").asText();
                            temp = forecast.path("main").path("temp").asDouble();
                            break;
                        }
                    }

                    if (willRainSoon) {
                        String message = String.format(
                                "🌧️ <b>Alerta de Chuva: %s</b>\n\n" +
                                        "A previsão indica <b>%s</b> por volta das %s.\n" +
                                        "A temperatura estará em %d°C.\n\n" +
                                        "Prepare o guarda-chuva se for passar por lá!",
                                cityName, description, rainTime, Math.round(temp)
                        );

                        eventPublisher.publishEvent(NotificationEvent.builder()
                                .type("WEATHER")
                                .message(message)
                                .build());

                        log.info("Alerta de chuva enviado para {}!", cityName);
                    } else {
                        log.info("Dia limpo em {}.", cityName);
                    }

                } catch (Exception e) {
                    log.error("Falha ao buscar previsão do tempo para {}: {}", city, e.getMessage());
                }
            }
        } finally {
            runningMorningWeather.set(false);
        }
    }

    public ArrayNode getCurrentWeather() {
        ArrayNode results = objectMapper.createArrayNode();

        for (String city : targetCities) {
            try {
                String responseBody = openWeatherWebClient.get()
                        .uri(uriBuilder -> uriBuilder.path("/weather")
                                .queryParam("q", city)
                                .queryParam("units", "metric")
                                .queryParam("lang", "pt_br")
                                .queryParam("appid", apiKey)
                                .build())
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                if (responseBody != null) {
                    results.add(objectMapper.readTree(responseBody));
                }
            } catch (Exception e) {
                log.error("Erro ao buscar clima atual para {}", city, e);
            }
        }
        return results;
    }
}
