import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/platform-components';
import { useNavigate, useParams } from 'react-router-dom';
import hackerImg from '../assets/hacker.png';
import { useSocket } from '../context/SocketContext';

export default function WaitingRoomPage({ username = 'You', isConnected: propsIsConnected = false, onDisconnect }) {
  const navigate = useNavigate();
  const { id: waitingid } = useParams();
  const { subscribe, send, isConnected: socketIsConnected } = useSocket();
  const isConnected = propsIsConnected || socketIsConnected;

  const [players, setPlayers] = useState([]);
  const [readyPlayers, setReadyPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [assignedRole, setAssignedRole] = useState(null);

  const playersRef      = useRef([]);
  const readyPlayersRef = useRef([]);
  const roleRef         = useRef(null);
  const isStartingRef   = useRef(false);
  const timeoutRef      = useRef(null);
  const pollRef         = useRef(null); // polls for role if it arrives after countdown

  const maxPlayers = 4;

  useEffect(() => { roleRef.current = assignedRole; }, [assignedRole]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { readyPlayersRef.current = readyPlayers; }, [readyPlayers]);

  /* ================================
     INITIAL REST FETCH
  ================================= */
  useEffect(() => {
    fetch(`http://localhost:8080/api/getAllByRoom/${waitingid}`)
      .then(res => res.json())
      .then(data => {
        const others = data
          .filter(user => user.username !== username)
          .map(u => u.username || u.name);

        const readyUsers = data
          .filter(user => user.ready === true)
          .map(u => u.username || u.name);

        setPlayers(others);
        setReadyPlayers(readyUsers);
      })
      .catch(err => console.error('Error fetching players:', err));
  }, [username, waitingid, navigate]);

  /* ================================
     WEBSOCKET SUBSCRIPTIONS
  ================================= */
  useEffect(() => {
    if (!username || !isConnected) return;

    const subs = [];

    subs.push(subscribe(`/queue/role/${username}`, (msg) => {
      const myRole = msg.body;
      console.log('Assigned role:', myRole);
      roleRef.current = myRole;
      setAssignedRole(myRole);

      // If countdown already finished and we were waiting, navigate now
      if (isStartingRef.current) {
        clearInterval(pollRef.current);
        navigate(`/role/${myRole}`, { state: { roomId: waitingid } });
      }
    }));

    subs.push(subscribe(`/queue/session/${username}`, (msg) => {
      const sessionId = msg.body;
      console.log('Received session ID reveal:', sessionId);
    }));

    subs.push(subscribe(`/topic/waiting/${waitingid}`, (message) => {
      const body = JSON.parse(message.body);
      console.log('Received message:', body);

      switch (body.type) {
        case 'JOIN':
          if (body.sender !== username) {
            setPlayers(prev => {
              const updated = prev.includes(body.sender) ? prev : [...prev, body.sender];
              playersRef.current = updated;
              return updated;
            });
          }
          break;

        case 'LEAVE':
          setPlayers(prev => {
            const updated = prev.filter(p => p !== body.sender);
            playersRef.current = updated;
            return updated;
          });
          setReadyPlayers(prev => {
            const updated = prev.filter(p => p !== body.sender);
            readyPlayersRef.current = updated;
            return updated;
          });
          break;

        case 'READY':
          setReadyPlayers(prev => {
            const newReady = prev.includes(body.sender) ? prev : [...prev, body.sender];
            readyPlayersRef.current = newReady;

            const allMembers = [username, ...playersRef.current];
            if (newReady.length >= allMembers.length && allMembers.length > 1) {
              send(`/app/player-ready/${waitingid}`, {}, JSON.stringify({
                sender: username,
                type: 'START_GAME',
                roomId: waitingid
              }));
            }
            return newReady;
          });
          break;

        case 'START_GAME':
          if (isStartingRef.current) break;
          isStartingRef.current = true;

          setIsStarting(true);
          setCountdown(3);

          timeoutRef.current = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timeoutRef.current);

                if (roleRef.current) {
                  navigate(`/role/${roleRef.current}`, { state: { roomId: waitingid } });
                } else {
                  // Role hasn't arrived yet — poll the ref every 100ms until it does
                  pollRef.current = setInterval(() => {
                    if (roleRef.current) {
                      clearInterval(pollRef.current);
                      navigate(`/role/${roleRef.current}`, { state: { roomId: waitingid } });
                    }
                  }, 100);
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          break;

        default:
          break;
      }
    }));

    subs.push(subscribe(`/user/queue/errors`, (msg) => {
      console.error(msg.body);
      alert(msg.body);
      navigate('/lobby');
    }));

    subs.push(subscribe(`/queue/errors/${username}`, (msg) => {
      alert(msg.body);
      navigate('/lobby');
    }));

    send(`/app/chat-addUser/${waitingid}`, {}, JSON.stringify({
      sender: username,
      type: 'JOIN',
      roomId: waitingid
    }));

    return () => {
      subs.forEach(s => s && s.unsubscribe());
      clearInterval(timeoutRef.current);
      clearInterval(pollRef.current);
    };
  }, [username, isConnected, waitingid, navigate, subscribe, send]);

  /* ================================
     HANDLERS
  ================================= */
  const handleReady = () => {
    if (!isConnected) return;

    send(`/app/player-ready/${waitingid}`, {}, JSON.stringify({
      sender: username,
      type: 'READY',
      roomId: waitingid
    }));

    setIsReady(true);
  };

  const handleLeave = async () => {
  setIsLeaving(true);
  console.log('Initiating leave process...');
  try {
    if (isConnected) {
      send(
        `/app/chat-removeUser/${waitingid}`,
        {},
        JSON.stringify({
          sender: username,
          type: 'LEAVE',
          roomId: waitingid
        })
      );

      // give websocket time to flush message
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  } catch (err) {
    console.error("Leave send failed:", err);
  }

  onDisconnect();

  navigate('/lobby');
};

  /* ================================
     UI PREPARATION
  ================================= */
  const allPlayers = [username, ...players];
  const paddedPlayers = [...allPlayers];
  while (paddedPlayers.length < maxPlayers) paddedPlayers.push(null);

  /* ================================
     RENDER
  ================================= */
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-xl sm:p-10">
        <div className="flex flex-col gap-8">

          {/* HEADER */}
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl font-extralight tracking-tight text-white sm:text-4xl">
              Waiting Room
            </h1>
            <p className="text-sm font-light text-white/45">
              Room: <span className="font-mono text-cyan-400">{waitingid || 'nexus-core'}</span>
            </p>
          </div>

          {/* PLAYER LIST */}
          <div className="flex flex-col gap-4">
            <p className="text-[10px] uppercase tracking-widest text-white/35">
              Participants
            </p>
            <ul className="space-y-2">
              {paddedPlayers.map((player, i) => {
                const isPlayerReady = readyPlayers.includes(player);
                return (
                  <li key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
                    <img src={hackerImg} alt="" className="h-8 w-8 rounded-full bg-white/20" />
                    <div className={`h-2 w-2 rounded-full ${
                      player
                        ? isPlayerReady ? 'bg-cyan-400' : 'bg-green-400'
                        : 'bg-white/20'
                    }`} />
                    <span className="text-sm text-white/70">
                      {player
                        ? player === username ? `${player} (You)` : player
                        : <span className="text-white/25 italic">Waiting...</span>}
                    </span>
                    {player && isPlayerReady && (
                      <span className="ml-auto text-[10px] text-cyan-400 uppercase">Ready</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col items-center gap-3">
            <Button primary onClick={handleReady} disabled={isReady} className="w-full">
              {isReady ? 'Ready ✓' : 'Ready'}
            </Button>
            <Button onClick={handleLeave} disabled={isLeaving} className="w-full">
              {isLeaving ? 'Leaving...' : 'Leave'}
            </Button>
          </div>

          {/* FOOTER */}
          <div className="flex justify-between border-t border-white/10 pt-5 text-[10px] uppercase text-white/35">
            <span>Uplink: {isConnected ? 'ESTABLISHED' : 'DISCONNECTED'}</span>
            <span>User: {username}</span>
          </div>

        </div>
      </div>

      {/* LEAVING OVERLAY */}
      {isLeaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-cyan-300 font-mono text-sm uppercase animate-pulse">Disconnecting...</p>
          </div>
        </div>
      )}

      {/* STARTING GAME OVERLAY — unchanged from original */}
      {isStarting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-white text-xl font-mono uppercase animate-pulse">
              Game starting in {countdown}...
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}