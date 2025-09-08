import React, { useEffect, useState } from "react";
import { TextInput, Button, Container, Group, CopyButton, Tooltip } from "@mantine/core";
import {Route, Routes, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { IconCopy } from "@tabler/icons-react";
import Room from "./components/Room";

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState("");

    useEffect(() => {
        const savedId = localStorage.getItem("my-room-id");
        if (savedId) setRoomId(savedId);
    }, []);

    const handleJoin = () => {
        let finalId = roomId.trim();
        if (!finalId) {
            finalId = uuidv4();
        }
        localStorage.setItem("my-room-id", finalId);
        navigate(`/room/${finalId}`);
    };

    const roomUrl = `${window.location.origin}/room/${roomId || localStorage.getItem("my-room-id") || ""}`;

    return (
        <Container size="xs" style={{ marginTop: 60 }}>
            <Group flex="column" gap="md">
                <TextInput
                    placeholder="Введите ID комнаты (или оставьте пустым)"
                    value={roomId}
                    onChange={(e) => setRoomId(e.currentTarget.value)}
                    style={{ width: "100%" }}
                />
                <Button fullWidth onClick={handleJoin}>Войти в комнату</Button>

                <CopyButton value={roomUrl}>
                    {({ copied, copy }) => (
                        <Tooltip label={copied ? "Скопировано!" : "Копировать ссылку"} withArrow>
                            <Button leftSection={<IconCopy size={16} />} variant="default" onClick={copy}>
                                {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
                            </Button>
                        </Tooltip>
                    )}
                </CopyButton>
            </Group>
        </Container>
    );
};


const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<Room />} />
        </Routes>
    );
};

export default App;
