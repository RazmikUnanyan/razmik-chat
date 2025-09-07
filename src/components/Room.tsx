import React, { useEffect, useRef, useState } from "react";
import { Peer as PeerClient } from "peerjs";
import { ActionIcon, Group, Paper, Button, TextInput, CopyButton, Tooltip } from "@mantine/core";
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
    const [otherPeerId, setOtherPeerId] = useState<string>("");

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

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
            if (urlOtherPeer && urlOtherPeer !== id) {
                const call = peer.call(urlOtherPeer, localStream.current!);
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
            peer.disconnect();
        };
    }, [roomId, searchParams]);

    const connectToPeer = () => {
        if (!otherPeerId) return;
        const peer = new PeerClient("", {
            host: "0.peerjs.com",
            port: 443,
            secure: true,
        });
        if (localStream.current) {
            const call = peer.call(otherPeerId, localStream.current);
            call?.on("stream", (remoteStream) => {
                if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
            });
        }
    };

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
        localStream.current?.getTracks().forEach((track) => track.stop());
        window.location.reload();
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

                {/*/!* Для ручного подключения к другому peer *!/*/}
                {/*<TextInput*/}
                {/*    placeholder="Введите Peer ID друга"*/}
                {/*    mt="sm"*/}
                {/*    value={otherPeerId}*/}
                {/*    onChange={(e) => setOtherPeerId(e.currentTarget.value)}*/}
                {/*/>*/}
                {/*<Button mt="xs" onClick={connectToPeer} fullWidth>*/}
                {/*    Подключиться к другу*/}
                {/*</Button>*/}
            </div>
        </div>
    );
};

export default Room;
