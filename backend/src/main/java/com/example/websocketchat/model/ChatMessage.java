package com.example.websocketchat.model;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatMessage {
    private MsgType type;
    private Sabotage sabotage;
    public enum MsgType {
        CHAT,
        JOIN,
        LEAVE,
        READY,
        CREATE,
        START_GAME,
        TASK_COMPLETE,
        VOTE,
        VOTE_RESULT,
        SABOTAGE,
        GAME_OVER,
        CODE_UPDATE,
        EMERGENCY_MEETING,
        COMPILE_VOTE_START,
        COMPILE_VOTE_CAST,
        COMPILE_RUNNING,
        COMPILE_RESULTS,
        TASK_STEP_COMPLETE

    }

    private gameDifficulty difficulty;
    private enum gameDifficulty {
        NORMAL,HARD,EASY
    }

    private String content;
    private String sender;
    /** Extra payload field – used for imposter name in VOTE_RESULT / GAME_OVER */
    private String target;

}
