package com.example.websocketchat.controller;

import com.example.websocketchat.model.Submission;
import com.example.websocketchat.service.CompilerService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/compile")
@AllArgsConstructor
public class CompileController {
    private final CompilerService CompilerService;

    @PostMapping("/")
    public String compile(@RequestBody Submission request) throws Exception {   

        return CompilerService.compileAndTestPython(request);
    }
}
