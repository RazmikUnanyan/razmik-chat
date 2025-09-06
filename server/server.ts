import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

// Комнаты: { roomId: [clients] }
const rooms: Record<string, WebSocket[]> = {};

wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (message: string) => {
        const data = JSON.parse(message);

        if (data.type === "join") {
            const { roomId } = data;
            if (!rooms[roomId]) {
                rooms[roomId] = [];
            }
            rooms[roomId].push(ws);

            console.log(`User joined room: ${roomId}`);

            // Сообщаем остальным участникам
            rooms[roomId].forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "user-joined" }));
                }
            });
        }

        if (data.type === "signal") {
            const { roomId, signal } = data;
            rooms[roomId]?.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "signal", signal }));
                }
            });
        }
    });

    ws.on("close", () => {
        // Удаляем из комнат
        for (const roomId in rooms) {
            rooms[roomId] = rooms[roomId].filter(c => c !== ws);
            if (rooms[roomId].length === 0) delete rooms[roomId];
        }
    });
});

console.log("WebRTC signaling server running on ws://localhost:8080");
