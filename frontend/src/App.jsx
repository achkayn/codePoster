import './App.css'
import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from 'react';
import DemoOne from "./pages/DemoOne";

import LobbyPage from "./pages/LobbyPage";
import RoomPage from "./pages/RoomPage";
import { ShaderBackground } from "./components/ui/neural-network-hero";
import RolePage from "./pages/RolePage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import CreateRoomPage from "./pages/CreateRoomPage";

import RevealPage from "./pages/RevealPage";
import ProfilePage from "./pages/ProfilePage";
import { SocketProvider } from "./context/SocketContext";
import { useSocket } from './context/SocketContext';
const ProtectedRoute = ({ isConnected, children }) => {
  if (!isConnected) {
    return <Navigate to="/lobby" replace />;
  }
  return children;
};

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
const { disconnect } = useSocket(); 
  const handleConnect = (newUsername) => {
    if (newUsername && newUsername.trim()) {
      setUsername(newUsername);
      setIsConnected(true);
      return true;
    }
    return false;
  };

  const handleDisconnect = async () => {
  console.log('Disconnecting user:', username);

   try {
    await disconnect(); // 🔥 THIS triggers backend event
  } catch (err) {
    console.error(err);
  }

  setUsername('');
  setIsConnected(false);
};
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <ShaderBackground />
      <Routes>
        <Route path="/" element={<DemoOne />} />

          <Route path="/lobby" element={<LobbyPage onConnect={handleConnect} isConnected={isConnected} />} />
          <Route
            path="/create-room"
            element={
              <ProtectedRoute isConnected={isConnected}>
                <CreateRoomPage username={username} isConnected={isConnected} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/waiting/:id"
            element={
              <ProtectedRoute isConnected={isConnected}>
                <WaitingRoomPage username={username} isConnected={isConnected} onDisconnect={handleDisconnect} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/room/:id"
            element={
              <ProtectedRoute isConnected={isConnected}>
                <RoomPage username={username} isConnected={isConnected} />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<h1>About</h1>} />
          <Route
            path="/role/:role"
            element={
              <ProtectedRoute isConnected={isConnected}>
                <RolePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reveal"
            element={
              <ProtectedRoute isConnected={isConnected}>
                <RevealPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="/profile" element={<ProfilePage username={username} />} />

        </Routes>
    </div>
  )
}

export default App
