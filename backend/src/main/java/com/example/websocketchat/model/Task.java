package com.example.websocketchat.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

// Task.java
@Document(collection = "tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Task {

    @Id
    private String id;

    private String key;           // "caesar_cipher", "merge_sort" etc — matches frontend file key
    private String title;         // "Implement Caesar Cipher"
    private String description;   // shown in briefing

    private String starterCode;   // what players start with (the buggy/empty version)
    private String solution;      // the correct reference solution
    private String testScript;    // python test runner for this task

    // What the solution should print when run
    // Each entry: { "input": "Hello,13", "expectedOutput": "Uryyb" }
    private List<TestCase> testCases;

    private int difficulty;       // easy-normal-hard

}

