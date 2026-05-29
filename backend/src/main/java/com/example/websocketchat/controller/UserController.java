package com.example.websocketchat.controller;

import com.example.websocketchat.model.User;
import com.example.websocketchat.service.userService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
 @RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173/")
public class UserController {
    private final userService userService;

    @GetMapping("/{username}")
    public ResponseEntity<User> findByUsername(@Valid @PathVariable String username) {
        User user=userService.findByUsername(username);
        return ResponseEntity.ok(user);
    }
    @PostMapping("/save")
    public ResponseEntity<User> save(@Valid @RequestBody User user) {
        userService.save(user);
        return ResponseEntity.ok(user);
    }
    @GetMapping("/getAll")//later with rooms
    public ResponseEntity<List<User>> getAll() {
        return ResponseEntity.ok(userService.findAll());
    }
    @DeleteMapping("/delAll")
    public void deleteAll() {
        userService.deleteAll();
    }
    @DeleteMapping("/del/{username}")//real one used in the disconnected listner
    public void deleteByUsername(@PathVariable String username) {
        userService.deleteByUsername(username);
    }


    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("description time");
    }

    @GetMapping("/getAllByRoom/{waitingid}")
    public ResponseEntity<List<User>> getAllByRoom(@PathVariable String waitingid) {

        List<User> list=userService.findByRoom(waitingid);
        System.out.println(list);
        return ResponseEntity.ok(list);
    }
}
