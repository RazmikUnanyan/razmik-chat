import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";

const VideoChat: React.FC<{ roomId: string }> = ({ roomId }) => {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [peer, setPeer] = useState<Peer.Instance | null>(null);
    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        setWs(socket);

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "join", roomId }));
        };

        socket.onmessage = (msg) => {
            const data = JSON.parse(msg.data);

            if (data.type === "user-joined") {
                // создаем peer инициатором
                createPeer(true);
            }

            if (data.type === "signal") {
                peer?.signal(data.signal);
            }
        };

        return () => {
            socket.close();
        };
    }, [roomId]);

    const createPeer = (initiator: boolean) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            if (localVideo.current) {
                localVideo.current.srcObject = stream;
            }

            const newPeer = new Peer({ initiator, trickle: false, stream });

            newPeer.on("signal", (signal) => {
                ws?.send(JSON.stringify({ type: "signal", roomId, signal }));
            });

            newPeer.on("stream", (remoteStream) => {
                if (remoteVideo.current) {
                    remoteVideo.current.srcObject = remoteStream;
                }
            });

            setPeer(newPeer);
        });
    };

    return (
        <div>
            <h2>Room: {roomId}</h2>
            <video ref={localVideo} autoPlay playsInline muted style={{ width: "300px" }} />
            <video ref={remoteVideo} autoPlay playsInline style={{ width: "300px" }} />
        </div>
    );
};

export default VideoChat;
