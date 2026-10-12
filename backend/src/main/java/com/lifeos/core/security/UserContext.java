package com.lifeos.core.security;

public final class UserContext {

    private static final ThreadLocal<String> CURRENT_USER = new ThreadLocal<>();

    private UserContext() {}

    public static void setUserId(String userId) {
        CURRENT_USER.set(userId);
    }

    public static String getUserId() {
        return CURRENT_USER.get();
    }

    public static void clear() {
        CURRENT_USER.remove();
    }

    public static String resolveUserId(String headerUserId) {
        if (headerUserId != null && !headerUserId.isBlank()
                && !"undefined".equalsIgnoreCase(headerUserId)
                && !"null".equalsIgnoreCase(headerUserId)
                && !"default".equalsIgnoreCase(headerUserId)
                && !"user".equalsIgnoreCase(headerUserId)) {
            return headerUserId;
        }
        String contextUser = CURRENT_USER.get();
        if (contextUser != null && !contextUser.isBlank()) {
            return contextUser;
        }
        return (headerUserId != null && !headerUserId.isBlank()) ? headerUserId : null;
    }
}
