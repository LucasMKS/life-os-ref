package com.lifeos.core.config;

import io.netty.channel.ChannelOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.lang.NonNull;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import reactor.netty.http.client.HttpClient;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;

@Configuration
@SuppressWarnings("null")
public class WebClientConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static WebClient.Builder timeoutBuilder() {
        HttpClient httpClient = HttpClient.create()
                .compress(true)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5_000)
                .responseTimeout(Duration.ofSeconds(10));

        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(codecs -> codecs.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                .build();

        return WebClient.builder()
                .exchangeStrategies(strategies)
                .clientConnector(new ReactorClientHttpConnector(httpClient));
    }

    @Bean
    public WebClient genericWebClient() {
        return timeoutBuilder().build();
    }

    // --- Telegram ---
    @Bean
    public WebClient telegramWebClient(@Value("${telegram.bot.token:}") String botToken) {
        return timeoutBuilder()
                .baseUrl("https://api.telegram.org/bot" + botToken)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    // --- F1 ---
    @Bean
    public WebClient openF1WebClient(@Value("${app.api-urls.openf1:https://api.openf1.org/v1}") String baseUrl) {
        return timeoutBuilder().baseUrl(baseUrl).build();
    }

    @Bean
    public WebClient jolpiWebClient() {
        return timeoutBuilder().baseUrl("https://api.jolpi.ca/ergast/f1").build();
    }

    @Bean
    public WebClient rss2JsonWebClient() {
        return timeoutBuilder().baseUrl("https://api.rss2json.com/v1/api.json").build();
    }

    // --- Gaming & Media ---
    @Bean
    public WebClient steamWebClient() {
        return timeoutBuilder().baseUrl("https://api.steampowered.com").build();
    }

    @Bean
    public WebClient steamStoreWebClient() {
        return timeoutBuilder().baseUrl("https://store.steampowered.com").build();
    }

    @Bean
    public WebClient twitchAuthWebClient() {
        return timeoutBuilder().baseUrl("https://id.twitch.tv/oauth2").build();
    }

    @Bean
    public WebClient twitchApiWebClient() {
        return timeoutBuilder().baseUrl("https://api.twitch.tv/helix").build();
    }

    @Bean
    public WebClient tmdbWebClient(@Value("${app.api-keys.tmdb:}") String apiKey) {
        return timeoutBuilder()
                .baseUrl("https://api.themoviedb.org/3")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader("accept", "application/json")
                .build();
    }

    // --- Weather ---
    @Bean
    public WebClient openWeatherWebClient() {
        return timeoutBuilder().baseUrl("https://api.openweathermap.org/data/2.5").build();
    }

    // --- Sports ---
    @Bean
    public WebClient espnSportsWebClient() {
        return timeoutBuilder()
                .baseUrl("https://site.api.espn.com/apis/site/v2/sports")
                .defaultHeader(HttpHeaders.USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .defaultHeader("Accept", "application/json")
                .build();
    }

    // --- Reading ---
    @Bean
    public WebClient googleBooksWebClient() {
        return timeoutBuilder().baseUrl("https://www.googleapis.com/books/v1/volumes").build();
    }

    @Bean
    public WebClient brasilApiWebClient() {
        return timeoutBuilder().baseUrl("https://brasilapi.com.br").build();
    }

    // --- Ecosystem Integrations ---
    @Bean
    public WebClient lmsFavoriteWebClient(@Value("${app.lmsfavorite-url:http://lmsfavorite:8083}") String baseUrl) {
        return timeoutBuilder().baseUrl(baseUrl).build();
    }

    @Bean
    public WebClient lmsRatingWebClient(@Value("${app.lmsrating-url:http://lmsrating:8082}") String baseUrl) {
        return timeoutBuilder().baseUrl(baseUrl).build();
    }

    // --- Serve static uploaded note images ---
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir);
        String absolutePath = uploadPath.toFile().getAbsolutePath();

        registry.addResourceHandler("/api/v1/notes/uploads/**")
                .addResourceLocations("file:" + absolutePath + "/");
    }
}
