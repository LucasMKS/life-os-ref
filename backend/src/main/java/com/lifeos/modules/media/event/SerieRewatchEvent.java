package com.lifeos.modules.media.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SerieRewatchEvent {
    private String email;
    private String serieId;
}
