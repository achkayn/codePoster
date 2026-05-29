package com.example.websocketchat.repository;

import com.example.websocketchat.model.Task;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {
   /* List<Task> findByActiveTrue();*/
    Optional<Task> findByKey(String key);
}
