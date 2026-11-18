package com.homeplate.security;

import com.homeplate.config.ApiException;
import com.homeplate.entity.Kitchen;
import com.homeplate.entity.User;
import com.homeplate.repository.KitchenRepository;
import com.homeplate.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Resolves the logged-in user (and their kitchen) for the current request. */
@Component
public class CurrentUser {
    private final UserRepository users;
    private final KitchenRepository kitchens;

    public CurrentUser(UserRepository users, KitchenRepository kitchens) {
        this.users = users;
        this.kitchens = kitchens;
    }

    public AuthPrincipal principal() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !(a.getPrincipal() instanceof AuthPrincipal p)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Please login to continue");
        }
        return p;
    }

    public User user() {
        return users.findById(principal().userId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User no longer exists"));
    }

    public Kitchen kitchen() {
        return kitchens.findByOwnerId(principal().userId())
                .orElseThrow(() -> ApiException.notFound("No kitchen registered for this account"));
    }
}
