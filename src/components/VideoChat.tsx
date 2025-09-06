import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";

const VideoChat: React.FC = () => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const peerRef = useRef<Peer.Instance | null>(null);
    const [initiator, setInitiator] = useState(false);

    useEffect(() => {
        wsRef.current = new WebSocket("https://razmik-chat.onrender.com/");

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (peerRef.current) {
                peerRef.current.signal(data);
            }
        };

        return () => {
            wsRef.current?.close();
        };
    }, []);

    const startCall = async () => {
        setInitiator(true);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current!.srcObject = stream;

        const peer = new Peer({
            initiator: true,
            trickle: true,
            stream,
        });

        peer.on("signal", (data) => {
            wsRef.current?.send(JSON.stringify(data));
        });

        peer.on("stream", (remoteStream) => {
            remoteVideoRef.current!.srcObject = remoteStream;
        });

        peerRef.current = peer;
    };

    const answerCall = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current!.srcObject = stream;

        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream,
        });

        peer.on("signal", (data) => {
            wsRef.current?.send(JSON.stringify(data));
        });

        peer.on("stream", (remoteStream) => {
            remoteVideoRef.current!.srcObject = remoteStream;
        });

        peerRef.current = peer;
    };

    return (
        <div>
            <h2>Chat</h2>
            <div>
                <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "45%" }} />
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "45%" }} />
            </div>
            {!initiator && <button onClick={startCall}>Start Call</button>}
            <button onClick={answerCall}>Answer Call</button>
        </div>
    );
};

export default VideoChat;
