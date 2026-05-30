package com.example.websocketchat;

import com.mongodb.client.MongoClient;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class WebSocketChatApplication {

    public static void main(String[] args) {
        SpringApplication.run(WebSocketChatApplication.class, args);
    }
    @Bean
    public ApplicationRunner mongoCheckMethod(MongoTemplate mongoTemplate) {
        return args -> {
            System.out.println("✅ Mongo OK");
        };
    }

}
