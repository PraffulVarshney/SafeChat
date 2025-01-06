// package com.SafeChat.websocket.entries;

// import jakarta.persistence.*;
// import org.hibernate.annotations.CreationTimestamp;
// import org.hibernate.annotations.UpdateTimestamp;

// import java.util.Date;

// @Table(name = "users")
// @Entity
// public class User {
//     @Id
//     @GeneratedValue(strategy = GenerationType.AUTO)
//     @Column(nullable = false)
//     private Integer id;

//     @Column(nullable = false)
//     private String fullName;

//     // @Column(unique = true, length = 100, nullable = false)
//     // private String email;

//     // @Column(nullable = false)
//     // private String password;

//     @CreationTimestamp
//     @Column(updatable = false, name = "created_at")
//     private Date createdAt;

//     @UpdateTimestamp
//     @Column(name = "updated_at")
//     private Date updatedAt;

//     // Getters and setters
// }
