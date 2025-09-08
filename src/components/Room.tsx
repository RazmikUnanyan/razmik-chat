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
import { useNavigate, useParams } from "react-router-dom";

const RETRY_INTERVAL_MS = 2000; // попытка дозвона каждые 2 секунды (если хост ещё не онлайн)
const MAX_RETRIES = 30; // максимум попыток (примерно 1 минута)

const defaultPeerOptions = {
    host: "0.peerjs.com",
    port: 443,
    secure: true,
    debug: 2,
    // Если у вас есть TURN/STUN — сюда их можно добавить:
    // config: {
    //   iceServers: [
    //     { urls: "stun:stun.l.google.com:19302" },
    //     { urls: "turn:your.turn.server:3478", username: "...", credential: "..." }
    //   ]
    // }
};

const Room: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const localVideo = useRef<HTMLVideoElement | null>(null);
    const remoteVideo = useRef<HTMLVideoElement | null>(null);

    const peerRef = useRef<PeerClient | null>(null);
    const currentCallRef = useRef<any>(null);
    const retryTimerRef = useRef<number | null>(null);

    const localStreamRef = useRef<MediaStream | null>(null);

    const [peerId, setPeerId] = useState<string>("");
    const [isHost, setIsHost] = useState<boolean>(false);
    const [micOn, setMicOn] = useState<boolean>(true);
    const [camOn, setCamOn] = useState<boolean>(true);
    const [status, setStatus] = useState<"idle" | "waiting" | "connected" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState<string>("");

    const roomUrl = `${window.location.origin}/room/${roomId}`;

    useEffect(() => {
        if (!roomId) {
            setErrorMsg("Room ID не найден в URL");
            setStatus("error");
            return;
        }

        let cancelled = false;
        let retries = 0;

        const cleanupPeer = () => {
            if (currentCallRef.current) {
                try { currentCallRef.current.close?.(); } catch (e) {}
                currentCallRef.current = null;
            }
            if (peerRef.current) {
                try { peerRef.current.destroy(); } catch (e) {}
                peerRef.current = null;
            }
        };

        const startAsHost = (peer: PeerClient, stream: MediaStream) => {
            setIsHost(true);
            setStatus("waiting"); // ждём гостей
            peer.on("call", (call) => {
                // кто-то звонит — отвечаем своим стримом
                try {
                    call.answer(stream);
                } catch (e) {
                    console.error("Answer error:", e);
                }
                call.on("stream", (remoteStream: MediaStream) => {
                    if (remoteVideo.current) {
                        remoteVideo.current.srcObject = remoteStream;
                        remoteVideo.current.play().catch(() => {});
                    }
                    setStatus("connected");
                });
                call.on("close", () => {
                    // гость отключился
                    setStatus("waiting");
                    if (remoteVideo.current) remoteVideo.current.srcObject = null;
                });
                call.on("error", (err: any) => {
                    console.error("Call error (host):", err);
                });
            });
        };

        const tryToCallHost = (peer: PeerClient, stream: MediaStream) => {
            if (!roomId) return;
            setStatus("waiting");
            const attempt = () => {
                if (cancelled) return;
                if (!peer || peer.disconnected) return;
                try {
                    const call = peer.call(roomId, stream);
                    currentCallRef.current = call;
                    call.on("stream", (remoteStream: MediaStream) => {
                        if (remoteVideo.current) {
                            remoteVideo.current.srcObject = remoteStream;
                            remoteVideo.current.play().catch(() => {});
                        }
                        setStatus("connected");
                    });
                    call.on("close", () => {
                        setStatus("waiting");
                        if (remoteVideo.current) remoteVideo.current.srcObject = null;
                        // можно пробовать заново
                        scheduleRetry();
                    });
                    call.on("error", (err: any) => {
                        console.warn("Call error (guest):", err);
                        // скорее всего хост ещё не готов — пробуем ещё
                        scheduleRetry();
                    });
                } catch (err) {
                    console.warn("Call exception (guest):", err);
                    scheduleRetry();
                }
            };

            const scheduleRetry = () => {
                if (cancelled) return;
                if (retries >= MAX_RETRIES) {
                    setStatus("error");
                    setErrorMsg("Не удалось дозвониться хосту. Попробуйте позже.");
                    return;
                }
                retries += 1;
                retryTimerRef.current = window.setTimeout(() => {
                    attempt();
                }, RETRY_INTERVAL_MS);
            };

            attempt();
        };

        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (localVideo.current) {
                    localVideo.current.srcObject = stream;
                    localVideo.current.play().catch(() => {});
                }
            } catch (err) {
                console.error("getUserMedia error:", err);
                setErrorMsg("Ошибка доступа к камере/микрофону. Разрешите доступ и перезагрузите страницу.");
                setStatus("error");
                return;
            }

            // попытка создать Peer с id = roomId (чтобы стать хостом)
            try {
                let peer = new PeerClient(roomId!, defaultPeerOptions as any);
                peerRef.current = peer;

                peer.on("open", (id: string) => {
                    // Если удалось зарегистрировать тот же id — значит мы хост
                    setPeerId(id);
                    if (id === roomId) {
                        startAsHost(peer, localStreamRef.current!);
                        console.log("Acting as HOST with id:", id);
                        setStatus("waiting");
                    } else {
                        // Редко: PeerJS может вернуть другой id — обрабатываем как guest
                        setIsHost(false);
                        tryToCallHost(peer, localStreamRef.current!);
                    }
                });

                peer.on("error", (err: any) => {
                    console.warn("Peer error on initial try:", err);
                    const msg = (err && (err.type || err.message)) || String(err);
                    // Если ID занят -> создаём peer без указания id (гость)
                    const idUnavailable =
                        msg?.toString().toLowerCase().includes("unavailable") ||
                        msg?.toString().toLowerCase().includes("taken") ||
                        msg?.toString().toLowerCase().includes("already exists") ||
                        msg?.toString().toLowerCase().includes("id is taken");

                    if (idUnavailable) {
                        // FALLBACK: создать peer с автоматически сгенерированным id (guest)
                        try {
                            peer.destroy();
                        } catch (e) {}
                        const guestPeer = new PeerClient('', defaultPeerOptions as any);
                        peerRef.current = guestPeer;

                        guestPeer.on("open", (id) => {
                            setPeerId(id);
                            setIsHost(false);
                            console.log("Created guest peer with id:", id);
                            // И пытаемся позвонить хосту (roomId)
                            tryToCallHost(guestPeer, localStreamRef.current!);
                        });

                        guestPeer.on("error", (e: any) => {
                            console.error("Guest peer error:", e);
                            setErrorMsg("Ошибка PeerJS (guest): " + (e?.message || e?.type || e));
                            setStatus("error");
                        });

                        // Если хост кому-то звонит — guest может также получать входящие звонки (но обычно guest звонит хосту)
                        guestPeer.on("call", (call) => {
                            call.answer(localStreamRef.current!);
                            call.on("stream", (remoteStream: MediaStream) => {
                                if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
                                setStatus("connected");
                            });
                        });
                    } else {
                        setErrorMsg("PeerJS error: " + (err?.message || JSON.stringify(err)));
                        setStatus("error");
                    }
                });
            } catch (err) {
                console.error("Error creating peer:", err);
                setErrorMsg("Не удалось создать Peer: " + String(err));
                setStatus("error");
            }
        };

        init();

        return () => {
            cancelled = true;
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => t.stop());
                localStreamRef.current = null;
            }
            try {
                if (peerRef.current) {
                    peerRef.current.destroy();
                    peerRef.current = null;
                }
            } catch (e) {
                console.warn("Error on cleanup peer:", e);
            }
            if (remoteVideo.current) remoteVideo.current.srcObject = null;
            if (localVideo.current) localVideo.current.srcObject = null;
        };
    }, [roomId]);

    const toggleMic = () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
        setMicOn((s) => !s);
    };

    const toggleCam = () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
        setCamOn((s) => !s);
    };

    const leaveCall = () => {
        try {
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        } catch (e) {
            console.warn("Leave cleanup error:", e);
        }
        navigate("/");
    };

    return (
        <div className={classes.container}>
            <video ref={remoteVideo} autoPlay playsInline className={classes.remoteVideo} />
            <video ref={localVideo} autoPlay playsInline muted className={classes.localVideo} />

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

                <div style={{ marginTop: 12 }}>
                    <CopyButton value={roomUrl}>
                        {({ copied, copy }) => (
                            <Tooltip label={copied ? "Скопировано!" : "Копировать ссылку"} withArrow>
                                <Button onClick={copy} fullWidth leftSection={<IconCopy size={16} />}>
                                    {copied ? "Ссылка скопирована" : "Копировать ссылку для друга"}
                                </Button>
                            </Tooltip>
                        )}
                    </CopyButton>
                </div>

                <div style={{ marginTop: 10, textAlign: "center" }}>
                    <div>Room: <strong>{roomId}</strong></div>
                    <div>Peer ID: <strong>{peerId || "..."}</strong> {isHost ? "(host)" : "(guest)"}</div>

                    {status === "connected" && <p style={{ color: "green" }}>✅ Подключено</p>}
                    {status === "waiting" && <p style={{ color: "orange" }}>⏳ Ожидание подключения...</p>}
                    {status === "error" && <p style={{ color: "red" }}>❌ Ошибка: {errorMsg}</p>}
                </div>
            </div>
        </div>
    );
};

export default Room;
