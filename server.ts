import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let clients: WebSocket[] = [];

wss.on("connection", (ws: WebSocket) => {
    clients.push(ws);

    ws.on("message", (message) => {
        clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on("close", () => {
        clients = clients.filter((c) => c !== ws);
    });
});

console.log("Signaling server running on ws://localhost:8080");
