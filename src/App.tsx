import React, { useState } from "react";
import VideoChat from "./components/VideoChat";

function App() {
    const [roomId, setRoomId] = useState("");
    const [joined, setJoined] = useState(false);

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
                    <button onClick={() => setJoined(true)}>Join Room</button>
                </div>
            ) : (
                <VideoChat roomId={roomId} />
            )}
        </div>
    );
}

export default App;
