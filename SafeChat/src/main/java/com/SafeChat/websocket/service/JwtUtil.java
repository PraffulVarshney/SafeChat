// package com.SafeChat.websocket.service;

// import io.jsonwebtoken.*;
// import io.jsonwebtoken.security.Keys;

// import java.security.Key;
// import java.util.Date;

// import org.springframework.stereotype.Component;

// import com.google.api.client.util.Value;

// @Component
// public class JwtUtil {

//     @Value("${jwt.secret}")
//     private static String SECRET_KEY;

//     public static String generateToken(String username) {
//         Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
//         return Jwts.builder()
//                 .setSubject(username)
//                 .setIssuedAt(new Date())
//                 .setExpiration(new Date(System.currentTimeMillis() + 3600000)) // 1 hour
//                 .signWith(key)
//                 .compact();
//     }

//     public static boolean validateToken(String token) {
//         try {
//             Jwts.parserBuilder()
//                     .setSigningKey(SECRET_KEY.getBytes())
//                     .build()
//                     .parseClaimsJws(token);
//             return true;
//         } catch (JwtException e) {
//             return false;
//         }
//     }

//     public static String extractUsername(String token) {
//         Claims claims = Jwts.parserBuilder()
//                 .setSigningKey(SECRET_KEY.getBytes())
//                 .build()
//                 .parseClaimsJws(token)
//                 .getBody();
//         return claims.getSubject();
//     }
// }
