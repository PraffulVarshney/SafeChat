// package com.SafeChat.websocket.controller;

// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import com.SafeChat.websocket.service.JwtUtil;
// import com.google.firestore.v1.ListenRequest;

// @RestController
// @RequestMapping("/auth")
// public class AuthController {

//     private final JwtUtil jwtUtil;

//     public AuthController(JwtUtil jwtUtil) {
//         this.jwtUtil = jwtUtil;
//     }

//     @PostMapping("/login")
//     public ResponseEntity<?> login(@RequestBody ListenRequest loginRequest) {
//         // Authenticate user (e.g., check username and password)
//         // If authentication is successful, generate JWT
//         String token = jwtUtil.generateToken(loginRequest.getUsername());

//         // Return the token as a response
//         return ResponseEntity.ok(new AuthResponse(token));
//     }
// }
