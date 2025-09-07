import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useNavigate,
    useParams,
} from "react-router-dom";

import { MantineProvider, Button, TextInput, Container, Stack, Title } from "@mantine/core";
import Room from "./components/Room";

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = React.useState("");

    const createRoom = () => {
        const id = roomId || Math.floor(Math.random() * 100000).toString();
        navigate(`/room/${id}`);
    };

    return (
        <Container size="xs" style={{ paddingTop: 50 }}>
            <Stack gap="md">
                <Title order={2} ta="center">
                    Размик — семейный чат
                </Title>

                <TextInput
                    placeholder="Введите ID комнаты (необязательно)"
                    value={roomId}
                    onChange={(e) => setRoomId(e.currentTarget.value)}
                />

                <Button onClick={createRoom} fullWidth>
                    Join / Create Room
                </Button>
            </Stack>
        </Container>
    );
};

// Обертка для получения roomId из URL
const RoomWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Room ID missing</div>;
    return <Room roomId={id} />;
};

const App: React.FC = () => {
    return (
        <MantineProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/room/:id" element={<RoomWrapper />} />
                </Routes>
            </Router>
        </MantineProvider>
    );
};

export default App;
