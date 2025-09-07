import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useNavigate,
    useParams,
} from "react-router-dom";

import {MantineProvider, Button, TextInput, Container, Stack, Title, Group} from "@mantine/core";
import Room from "./components/Room";
import {IconDoorEnter, IconVideoPlus} from "@tabler/icons-react";

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = React.useState("");

    const createRoom = () => {
        const id = roomId || Math.floor(Math.random() * 100000).toString();
        navigate(`/room/${id}`);
    };

    return (
        <Container
            size="xs"
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
            }}
        >
            <Stack gap="xl" style={{ width: "100%" }}>
                <Title order={2} ta="center">
                    Razmik Chat
                </Title>

                <Group grow>
                    <Button
                        leftSection={<IconVideoPlus size={18} />}
                        color="blue"
                        onClick={createRoom}
                    >
                        Create Room
                    </Button>
                </Group>
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
