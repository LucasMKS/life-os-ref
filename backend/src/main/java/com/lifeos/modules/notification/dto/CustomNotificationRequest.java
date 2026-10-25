package com.lifeos.modules.notification.dto;

import com.lifeos.modules.notification.model.RecurrenceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomNotificationRequest {

    @NotBlank(message = "Título é obrigatório")
    private String title;

    private String description;

    @NotBlank(message = "Horário é obrigatório")
    @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Horário deve estar no formato HH:mm (ex: 09:00)")
    private String time;

    @Builder.Default
    private RecurrenceType recurrence = RecurrenceType.DAILY;

    private String daysOfWeek;

    private LocalDate specificDate;

    @Builder.Default
    private Boolean enabled = true;

    @Builder.Default
    private Boolean sendTelegram = true;
}
