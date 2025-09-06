import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { Peer as PeerClient } from "peerjs";

interface VideoChatProps {
    roomId: string;
}

const VideoChat: React.FC<VideoChatProps> = ({ roomId }) => {
    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const [peerInstance, setPeerInstance] = useState<Peer.Instance | null>(null);

    useEffect(() => {
        const peer = new PeerClient(roomId, {
            host: "0.peerjs.com",  // бесплатный облачный PeerJS
            port: 443,
            secure: true,
        });

        peer.on("open", (id) => {
            console.log("My peer ID:", id);
        });

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            if (localVideo.current) localVideo.current.srcObject = stream;

            peer.on("call", (call) => {
                // кто-то звонит нам
                call.answer(stream);
                call.on("stream", (remoteStream) => {
                    if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
                });
            });

            // если вы инициатор, можно звонить другому peer по roomId
            const otherPeerId = prompt("Enter other user's room ID (if exists):");
            if (otherPeerId) {
                const call = peer.call(otherPeerId, stream);
                call.on("stream", (remoteStream) => {
                    if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
                });
            }
        });

        return () => {
            peer.disconnect();
        };
    }, [roomId]);

    return (
        <div>
            <h2>Room: {roomId}</h2>
            <video ref={localVideo} autoPlay playsInline muted style={{ width: 300 }} />
            <video ref={remoteVideo} autoPlay playsInline style={{ width: 300 }} />
        </div>
    );
};

export default VideoChat;
