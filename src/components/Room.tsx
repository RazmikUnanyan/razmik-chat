import React, { useEffect, useRef, useState } from "react";
import { Peer as PeerClient } from "peerjs";
import { ActionIcon, Group, Button, CopyButton, Tooltip } from "@mantine/core";
import {
    IconMicrophone,
    IconMicrophoneOff,
    IconVideo,
    IconVideoOff,
    IconPhoneOff,
    IconCopy,
} from "@tabler/icons-react";
import classes from "./Room.module.css";
import { useSearchParams, useNavigate } from "react-router-dom";

interface RoomProps {
    roomId: string;
}

const Room: React.FC<RoomProps> = ({ roomId }) => {
    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const [peerId, setPeerId] = useState<string>("");
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const localStream = useRef<MediaStream | null>(null);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Генерируем ссылку с peerId
    const roomUrl = `${window.location.origin}/room/${roomId}?peerId=${peerId}`;

    useEffect(() => {
        const peer = new PeerClient("", {
            host: "0.peerjs.com",
            port: 443,
            secure: true,
        });

        peer?.on("open", (id) => {
            console.log("My Peer ID:", id);
            setPeerId(id);

            // Если в URL уже есть peerId другого пользователя, сразу подключаемся
            const urlOtherPeer = searchParams.get("peerId");
            if (urlOtherPeer && urlOtherPeer !== id && localStream.current) {
                const call = peer.call(urlOtherPeer, localStream.current);
                call?.on("stream", (remoteStream) => {
                    if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
                });
            }
        });

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            localStream.current = stream;
            if (localVideo.current) localVideo.current.srcObject = stream;

            peer?.on("call", (call) => {
                call.answer(stream);
                call?.on("stream", (remoteStream) => {
                    if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
                });
            });
        });

        return () => {
            // Очистка при размонтировании
            localStream.current?.getTracks().forEach((track) => track.stop());
            if (localVideo.current) localVideo.current.srcObject = null;
            if (remoteVideo.current) remoteVideo.current.srcObject = null;
            peer.disconnect();
        };
    }, [roomId, searchParams]);

    const toggleMic = () => {
        if (localStream.current) {
            localStream.current.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
        }
        setMicOn((prev) => !prev);
    };

    const toggleCam = () => {
        if (localStream.current) {
            localStream.current.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
        }
        setCamOn((prev) => !prev);
    };

    const leaveCall = () => {
        // Останавливаем все локальные треки
        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => track.stop());
        }

        // Отвязываем видео
        if (localVideo.current) localVideo.current.srcObject = null;
        if (remoteVideo.current) remoteVideo.current.srcObject = null;

        setMicOn(false);
        setCamOn(false);

        // Редирект на главную
        navigate("/");
    };

    return (
        <div className={classes.container}>
            {/* Удалённое видео */}
            <video ref={remoteVideo} autoPlay playsInline className={classes.remoteVideo} />

            {/* Локальное видео */}
            <video ref={localVideo} autoPlay playsInline muted className={classes.localVideo} />

            {/* Панель управления */}
            <div className={classes.controls}>
                <Group justify="center" gap="lg">
                    <ActionIcon size="xl" radius="xl" color={micOn ? "blue" : "red"} onClick={toggleMic}>
                        {micOn ? <IconMicrophone size={24} /> : <IconMicrophoneOff size={24} />}
                    </ActionIcon>

                    <ActionIcon size="xl" radius="xl" color={camOn ? "blue" : "red"} onClick={toggleCam}>
                        {camOn ? <IconVideo size={24} /> : <IconVideoOff size={24} />}
                    </ActionIcon>

                    <ActionIcon size="xl" radius="xl" color="red" onClick={leaveCall}>
                        <IconPhoneOff size={24} />
                    </ActionIcon>
                </Group>

                {/* Копирование ссылки */}
                <CopyButton value={roomUrl}>
                    {({ copied, copy }) => (
                        <Tooltip label={copied ? "Скопировано!" : "Скопировать ссылку"} withArrow>
                            <Button mt="md" onClick={copy} leftSection={<IconCopy size={16} />} fullWidth>
                                {copied ? "Ссылка скопирована" : "Скопировать ссылку для друга"}
                            </Button>
                        </Tooltip>
                    )}
                </CopyButton>
            </div>
        </div>
    );
};

export default Room;
