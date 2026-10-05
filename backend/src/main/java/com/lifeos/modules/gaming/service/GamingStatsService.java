package com.lifeos.modules.gaming.service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.lifeos.modules.gaming.dto.ActivityRadarDTO;
import com.lifeos.modules.gaming.model.GameNews;

@Service
public class GamingStatsService {

    private static final Logger logger = LoggerFactory.getLogger(GamingStatsService.class);
    
    private final GamingNewsService gamingNewsService;
    private final com.lifeos.modules.gaming.repository.DailyPlaytimeLogRepository dailyPlaytimeLogRepository;
    
    public GamingStatsService(GamingNewsService gamingNewsService, com.lifeos.modules.gaming.repository.DailyPlaytimeLogRepository dailyPlaytimeLogRepository) {
        this.gamingNewsService = gamingNewsService;
        this.dailyPlaytimeLogRepository = dailyPlaytimeLogRepository;
    }

    public List<com.lifeos.modules.gaming.model.DailyPlaytimeLog> getDailyPlaytime(String userId, LocalDate startDate, LocalDate endDate) {
        return dailyPlaytimeLogRepository.findByUserIdAndDateBetweenOrderByDateDesc(userId, startDate, endDate);
    }

    public List<ActivityRadarDTO> getGamingActivityRadar(String userId) {
        logger.info("Calculando radar de atividades de Gaming para o usuário {}", userId);
        List<ActivityRadarDTO> radar = new ArrayList<>();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        List<GameNews> recentNews = gamingNewsService.getLatestNews(userId);

        for (int i = 6; i >= 0; i--) {
            LocalDate targetDate = today.minusDays(i);
            
            String dayName = targetDate.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.forLanguageTag("pt-BR"));
            dayName = dayName.substring(0, 1).toUpperCase() + dayName.substring(1);

            long activities = recentNews.stream()
                    .filter(news -> news.getPublishedAt().toLocalDate().equals(targetDate))
                    .count();
            
            radar.add(new ActivityRadarDTO(dayName, (int) activities));
        }

        return radar;
    }
}