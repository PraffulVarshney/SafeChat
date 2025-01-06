// package com.SafeChat.websocket.config;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.web.SecurityFilterChain;

// @Configuration
// public class SecurityConfig {

//     @Bean
//     public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//         http.csrf(csrf -> csrf.disable()) // Disable CSRF if not needed
//                 .authorizeHttpRequests(auth -> auth
//                         .requestMatchers("/chats/**").authenticated() // Protect `/chats/**` endpoints
//                         .anyRequest().permitAll() // Allow other requests
//                 )
//                 .addFilter(new JwtAuthenticationFilter()); // Add your JWT filter
//         return http.build();
//     }
// }
