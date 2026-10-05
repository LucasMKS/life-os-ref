package com.lifeos.modules.notes.service;

import com.lifeos.modules.notes.repository.QuickNoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Paths;
import java.util.Iterator;

@Service
@Slf4j
@RequiredArgsConstructor
public class ImageProcessorService {

    private final QuickNoteRepository repository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Async
    public void processImageAsync(String noteId) {
        log.info("[Async] Iniciando otimização em background da imagem. Nota ID: {}", noteId);

        repository.findById(noteId).ifPresent(note -> {
            String imageUrl = note.getImageUrl();
            if (imageUrl == null || !imageUrl.contains("/uploads/")) return;

            try {
                String fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
                File inputFile = Paths.get(uploadDir, fileName).toFile();

                if (!inputFile.exists()) {
                    log.warn("Arquivo não encontrado no disco para compressão: {}", inputFile.getAbsolutePath());
                    return;
                }

                BufferedImage originalImage = ImageIO.read(inputFile);
                if (originalImage == null) return;

                int targetWidth = originalImage.getWidth();
                int targetHeight = originalImage.getHeight();

                if (targetWidth > 1200) {
                    targetHeight = (int) (targetHeight * (1200.0 / targetWidth));
                    targetWidth = 1200;
                }

                BufferedImage resizedImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
                Graphics2D g2d = resizedImage.createGraphics();
                g2d.setColor(Color.WHITE);
                g2d.fillRect(0, 0, targetWidth, targetHeight);
                g2d.drawImage(originalImage, 0, 0, targetWidth, targetHeight, null);
                g2d.dispose();

                Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
                if (writers.hasNext()) {
                    ImageWriter writer = writers.next();
                    try (ImageOutputStream ios = ImageIO.createImageOutputStream(new FileOutputStream(inputFile))) {
                        writer.setOutput(ios);
                        ImageWriteParam param = writer.getDefaultWriteParam();
                        if (param.canWriteCompressed()) {
                            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                            param.setCompressionQuality(0.7f);
                        }
                        writer.write(null, new IIOImage(resizedImage, null, null), param);
                    }
                    writer.dispose();
                }

                log.info("[Async] Imagem da Nota '{}' redimensionada e otimizada com sucesso!", note.getTitle() != null ? note.getTitle() : "Sem Título");

            } catch (Exception e) {
                log.error("Erro durante o processamento/compressão da imagem", e);
            }
        });
    }
}