package com.example.websocketchat.repository;

import com.mongodb.client.MongoClient;
import org.bson.Document;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MongoCheck {

    @Bean
    public CommandLineRunner verifyConnection(MongoClient mongoClient) {
        return args -> {
            try {
                // This forces a network call to Atlas
                Document buildInfo = mongoClient.getDatabase("admin").runCommand(new Document("buildInfo", 1));
                System.out.println("✅ MongoDB Atlas Connected!");
                System.out.println("📊 MongoDB Version: " + buildInfo.get("version"));
            } catch (Exception e) {
                System.err.println("❌ MongoDB Atlas Connection Failed!");
                System.err.println("Error Detail: " + e.getMessage());
                System.err.println("Check: 1. IP Whitelist in Atlas, 2. Password encoding, 3. Database name in URI");
            }
        };
    }
}