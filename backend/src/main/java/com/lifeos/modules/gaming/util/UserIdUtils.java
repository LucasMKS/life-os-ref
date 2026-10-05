package com.lifeos.modules.gaming.util;

public final class UserIdUtils {

    private UserIdUtils() {}

    public static String resolve(String userId) {
        return (userId == null || userId.isBlank()) ? null : userId;
    }

    public static String require(String userId) {
        String resolved = resolve(userId);
        if (resolved == null) {
            throw new IllegalArgumentException("User id is required.");
        }
        return resolved;
    }
}
