package com.example.websocketchat.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "usernames")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class User {
    @Id
    private String id;
    @NonNull
    private String username;

    private String waitingroomId;


    private boolean ready;//false by def

    private boolean Imposter;


    private boolean roomOwner;

    private String sessionId;
}
