package com.lifeos.core.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    private GenericJackson2JsonRedisSerializer jsonRedisSerializer() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        return new GenericJackson2JsonRedisSerializer(mapper);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(jsonRedisSerializer());
        template.setHashValueSerializer(jsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .disableCachingNullValues()
                .computePrefixWith(cacheName -> "lifeos::" + cacheName + "::")
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jsonRedisSerializer()));

        Map<String, RedisCacheConfiguration> specificConfigs = new HashMap<>();

        // F1
        specificConfigs.put("f1_sessions", defaultConfig.entryTtl(Duration.ofMinutes(3)));
        specificConfigs.put("f1_weather", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        specificConfigs.put("f1_podium", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        specificConfigs.put("f1_standings", defaultConfig.entryTtl(Duration.ofMinutes(20)));
        specificConfigs.put("f1_constructors", defaultConfig.entryTtl(Duration.ofMinutes(20)));
        specificConfigs.put("f1_circuit", defaultConfig.entryTtl(Duration.ofMinutes(45)));
        specificConfigs.put("f1_news", defaultConfig.entryTtl(Duration.ofMinutes(45)));

        // Gaming / Twitch / Weather
        specificConfigs.put("gaming_news", defaultConfig.entryTtl(Duration.ofHours(2)));
        specificConfigs.put("twitch_live", defaultConfig.entryTtl(Duration.ofMinutes(3)));
        specificConfigs.put("weather_current", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        specificConfigs.put("steam_profile", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        specificConfigs.put("steam_library", defaultConfig.entryTtl(Duration.ofHours(1)));

        // Media / Radar
        specificConfigs.put("radar_releases", defaultConfig.entryTtl(Duration.ofHours(4)));
        specificConfigs.put("radar_weekly", defaultConfig.entryTtl(Duration.ofHours(6)));
        specificConfigs.put("radar_overview", defaultConfig.entryTtl(Duration.ofHours(2)));

        // Sports
        specificConfigs.put("sports_scoreboard", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        specificConfigs.put("sports_teams", defaultConfig.entryTtl(Duration.ofHours(12)));
        specificConfigs.put("sports_leagues", defaultConfig.entryTtl(Duration.ofDays(1)));
        specificConfigs.put("sports_summary", defaultConfig.entryTtl(Duration.ofMinutes(2)));

        // Reading & Finance
        specificConfigs.put("reading_library", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        specificConfigs.put("reading_summary", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        specificConfigs.put("finance_subscriptions", defaultConfig.entryTtl(Duration.ofMinutes(15)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(specificConfigs)
                .build();
    }
}
