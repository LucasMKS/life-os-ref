package com.lifeos.modules.notification.listener;

import com.lifeos.modules.notification.service.NotificationService;
import com.lifeos.modules.notification.service.NotificationSettingsService;
import com.lifeos.modules.notification.service.TelegramService;
import com.lifeos.shared.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationEventListener {

    private final TelegramService telegramService;
    private final NotificationService notificationService;
    private final NotificationSettingsService notificationSettingsService;

    @Value("${app.site-url:http://localhost:5173}")
    private String siteUrl;

    @Value("${app.bot-user-id:}")
    private String ownerUserId;

    @Async("taskExecutor")
    @EventListener
    public void handleNotificationEvent(NotificationEvent event) {
        try {
            log.info("Processando NotificationEvent (tipo={})...", event.getType());

            String type = (event.getType() != null && !event.getType().isBlank()) ? event.getType().toUpperCase() : "SYSTEM";
            String userId = (event.getUserId() != null && !event.getUserId().isBlank()) ? event.getUserId() : ownerUserId;

            if (!notificationSettingsService.isNotificationAllowed(userId, type)) {
                log.info("Notificação do tipo {} para usuário {} ignorada devido às preferências/quiet hours.", type, userId);
                return;
            }

            notificationService.saveAndNotify(event.getMessage(), type, userId);

            String formattedMessage = "🤖 <b>LifeOS - LucasMKS</b>\n\n" + event.getMessage();
            String targetChatId = notificationSettingsService.getEffectiveChatId(userId);

            if (event.getButtonLabel() != null && !event.getButtonLabel().isBlank()
                    && event.getButtonPath() != null && !event.getButtonPath().isBlank()) {
                String buttonPath = event.getButtonPath();
                String url = buttonPath.startsWith("http://") || buttonPath.startsWith("https://")
                        ? buttonPath
                        : siteUrl + (buttonPath.startsWith("/") ? buttonPath : "/" + buttonPath);
                telegramService.sendMessageToChat(targetChatId, formattedMessage, event.getButtonLabel(), url);
            } else {
                telegramService.sendMessageToChat(targetChatId, formattedMessage);
            }

        } catch (Exception ex) {
            log.error("Falha ao processar evento de notificação: {}", ex.getMessage(), ex);
        }
    }
}
