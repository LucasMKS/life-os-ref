package com.lifeos.modules.media.dto;

import java.util.List;

public record WeeklyCalendarDayDTO(
        String date,
        String dayLabel,
        List<ReleaseRadarDTO> releases
) {}
