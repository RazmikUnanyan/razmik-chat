import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from "react-router-dom";
import Room from "./components/Room";

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = React.useState("");

    const createRoom = () => {
        const id = roomId || Math.floor(Math.random() * 100000).toString();
        navigate(`/room/${id}`);
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>WebRTC Video Chat</h1>
            <input
                type="text"
                placeholder="Enter room ID (optional)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
            />
            <button onClick={createRoom} style={{ marginLeft: 10 }}>
                Join / Create Room
            </button>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/room/:id" element={<RoomWrapper />} />
            </Routes>
        </Router>
    );
};

// Обертка для получения roomId из URL
const RoomWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Room ID missing</div>;
    return <Room roomId={id} />;
};

export default App;
