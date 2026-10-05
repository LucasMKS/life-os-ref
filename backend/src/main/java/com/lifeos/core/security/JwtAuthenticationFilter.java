package com.lifeos.core.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.Set;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Set<String> PUBLIC_PATH_PREFIXES = Set.of(
            "/actuator",
            "/api/v1/notes/uploads",
            "/api/v1/notifications/telegram/webhook"
    );

    @Value("${jwt.secret:dHJvcXVlX3Bvcl91bV9zZWdyZWRvX2p3dF9iYXNlNjRfb3Vfc3RyaW5nX2xvbmdhX2Vfc2VndXJh}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        boolean isPublicRoute = PUBLIC_PATH_PREFIXES.stream().anyMatch(path::startsWith);
        if (isPublicRoute) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        String token = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else {
            // Fallback para query param 'token' (necessário para SSE/EventSource no browser)
            token = request.getParameter("token");
        }

        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            SecretKey key = resolveKey(jwtSecret);
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            Object idObj = claims.get("id");
            String userId = (idObj != null) ? String.valueOf(idObj) : null;
            if (userId == null || userId.isBlank()) {
                userId = claims.getSubject();
            }

            if (userId != null && !userId.isBlank()) {
                UserContext.setUserId(userId);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

            filterChain.doFilter(request, response);
        } catch (Exception e) {
            log.debug("JWT validation failed for path {}: {}", path, e.getMessage());
            SecurityContextHolder.clearContext();
            filterChain.doFilter(request, response);
        } finally {
            UserContext.clear();
        }
    }

    private SecretKey resolveKey(String secret) {
        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(secret.getBytes(StandardCharsets.UTF_8));
            if (keyBytes.length < 32) {
                keyBytes = secret.getBytes(StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
