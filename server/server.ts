import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

let clients = [];

wss.on("connection", (ws) => {
    clients.push(ws);

    ws.on("message", (message) => {
        clients.forEach((client) => {
            if (client !== ws && client.readyState === client.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on("close", () => {
        clients = clients.filter((c) => c !== ws);
    });
});

console.log(`Signaling server running on port ${PORT}`);
