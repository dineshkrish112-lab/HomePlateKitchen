package com.homeplate.security;

import com.homeplate.entity.Role;

/** Lightweight principal stored in the security context for each request. */
public record AuthPrincipal(Long userId, String username, Role role) {}
