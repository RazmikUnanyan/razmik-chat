import React, { useEffect, useRef } from "react";
import Peer from "simple-peer";
import { Peer as PeerClient } from "peerjs";

interface Props {
    roomId: string;
    isInitiator: boolean; // первый или второй пользователь
}

const VideoChat: React.FC<Props> = ({ roomId, isInitiator }) => {
    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const peer = new PeerClient(roomId, {
            host: "0.peerjs.com",
            port: 443,
            secure: true,
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

            // если мы второй пользователь (не инициатор), звонок первому
            if (!isInitiator) {
                const call = peer.call(roomId, stream); // звонок по ID комнаты
                call.on("stream", (remoteStream) => {
                    if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
                });
            }
        });

        return () => {
            peer.disconnect();
        };
    }, [roomId, isInitiator]);

    return (
        <div>
            <h2>Room: {roomId}</h2>
            <video ref={localVideo} autoPlay playsInline muted style={{ width: 300 }} />
            <video ref={remoteVideo} autoPlay playsInline style={{ width: 300 }} />
        </div>
    );
};

export default VideoChat;
