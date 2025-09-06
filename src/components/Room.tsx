import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { Peer as PeerClient } from "peerjs";

interface RoomProps {
    roomId: string;
}

const Room: React.FC<RoomProps> = ({ roomId }) => {
    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const [peerId, setPeerId] = useState<string>("");

    useEffect(() => {
        // создаём уникальный peer ID
        const peer = new PeerClient('', {
            host: "0.peerjs.com",
            port: 443,
            secure: true,
        });

        peer.on("open", (id) => {
            console.log("My Peer ID:", id);
            setPeerId(id);
        });

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            if (localVideo.current) localVideo.current.srcObject = stream;

            // слушаем входящие звонки
            peer.on("call", (call) => {
                call.answer(stream);
                call.on("stream", (remoteStream) => {
                    if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
                });
            });

            // Проверка: если мы первый, ждём звонка.
            // Если кто-то уже есть, пользователь должен вручную позвонить.
            const otherPeerId = prompt(
                "Enter Peer ID of the person you want to connect (if exists, leave blank if you are first)"
            );
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
        <div style={{ padding: 20 }}>
            <h2>Room: {roomId}</h2>
            <p>Your Peer ID: {peerId}</p>
            <video ref={localVideo} autoPlay playsInline muted style={{ width: 300, marginRight: 10 }} />
            <video ref={remoteVideo} autoPlay playsInline style={{ width: 300 }} />
        </div>
    );
};

export default Room;
