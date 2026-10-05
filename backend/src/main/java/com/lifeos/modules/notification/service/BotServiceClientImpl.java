package com.lifeos.modules.notification.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeos.modules.f1.service.F1Service;
import com.lifeos.modules.media.service.ReleaseRadarService;
import com.lifeos.modules.reading.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Service
@Primary
@Slf4j
@RequiredArgsConstructor
public class BotServiceClientImpl implements BotServiceClient {

    private final ObjectMapper objectMapper;
    private final F1Service f1Service;
    private final BookRepository bookRepository;
    private final ReleaseRadarService releaseRadarService;

    @Override
    public JsonNode getNextF1Sessions() {
        try {
            return objectMapper.valueToTree(f1Service.getNextSessions());
        } catch (Exception e) {
            log.error("Erro ao obter próximas sessões de F1 para o bot", e);
            return objectMapper.createArrayNode();
        }
    }

    @Override
    public JsonNode getReadingLibrary() {
        try {
            return objectMapper.valueToTree(bookRepository.findAll());
        } catch (Exception e) {
            log.error("Erro ao obter biblioteca de leitura para o bot", e);
            return objectMapper.createArrayNode();
        }
    }

    @Override
    public JsonNode getRadarReleases() {
        try {
            return objectMapper.valueToTree(releaseRadarService.getUpcomingReleases("default", null));
        } catch (Exception e) {
            log.error("Erro ao obter lançamentos do radar para o bot", e);
            return objectMapper.createArrayNode();
        }
    }
}
