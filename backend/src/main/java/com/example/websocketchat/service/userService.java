package com.example.websocketchat.service;


import com.example.websocketchat.model.User;
import com.example.websocketchat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@EnableCaching
@RequiredArgsConstructor
public class userService {
    private final UserRepository userRepository;

    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    public void deleteByUsername(String username) {
        userRepository.deleteByUsername(username);
    }
    public void save(User user) {
        userRepository.save(user);
    }


    public List<User> findAll() {
        return userRepository.findAll();
    }
    public void deleteAll() {
        userRepository.deleteAll();
    }
    @CachePut(value = "users", key = "#room")
    public List<User> findByRoom(String room) {
        return userRepository.findByWaitingroomId(room);
    }

    public void changeReady(String username,String roomId) {
        User user = userRepository.findByUsernameAndWaitingroomId(username,roomId);
        System.out.println(user.isReady());
        if(user.isReady()){
            user.setReady(false);
        }
        else{
            user.setReady(true);
        }
        System.out.println(user.isReady());
        userRepository.save(user);
    }
    public int readyNumber(String roomId) {
        List<User> users = userRepository.findByReadyAndWaitingroomId(true, roomId);
        int count = users.size();
        return count;
    }
    public boolean checkExistingRoom(String roomId){
        return !userRepository.findByWaitingroomId(roomId).isEmpty();
    }

    public User findRoomOwner(String roomId){
        List<User> users = userRepository.findByWaitingroomId(roomId);
        User roomOwner=users.stream().filter(u->u.isRoomOwner()).findFirst().orElse(null);
        return roomOwner;
    }
    public User findBySessionId(String sessionId){
        return userRepository.findOneBySessionId(sessionId);
    }

}
