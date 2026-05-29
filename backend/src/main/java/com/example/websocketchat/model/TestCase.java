package com.example.websocketchat.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// TestCase.java (embedded document)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TestCase {
    private String expectedOutput;   // exact string the code should print
}

