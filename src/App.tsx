import React, { useState } from "react";
import VideoChat from "./components/VideoChat";

function App() {
    const [roomId, setRoomId] = useState("");
    const [joined, setJoined] = useState(false);
    const [isInitiator, setIsInitiator] = useState(true);

    return (
        <div>
            {!joined ? (
                <div>
                    <input
                        type="text"
                        placeholder="Enter Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <button
                        onClick={() => {
                            setIsInitiator(true); // первый пользователь
                            setJoined(true);
                        }}
                    >
                        Create Room
                    </button>
                    <button
                        onClick={() => {
                            setIsInitiator(false); // второй пользователь
                            setJoined(true);
                        }}
                    >
                        Join Room
                    </button>
                </div>
            ) : (
                <VideoChat roomId={roomId} isInitiator={isInitiator} />
            )}
        </div>
    );
}

export default App;
