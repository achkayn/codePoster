package com.example.websocketchat.repository;

import com.example.websocketchat.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface UserRepository extends MongoRepository<User, String> {
    User findByUsername(String username);
    void deleteByUsername(String username);
    void deleteAll();


    List<User> findByWaitingroomId(String waitingroomId);
    List<User> findByReady(boolean ready);
    User findOneByWaitingroomId(String waitingroomId);
    User findOneBySessionId(String sessionId);
    User findByUsernameAndWaitingroomId(String username,String waitingroomId);
    User deleteByUsernameAndWaitingroomId(String username,String waitingroomId);
}
