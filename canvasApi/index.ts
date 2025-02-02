import express from "express";
import expressWs from "express-ws";
import cors from 'cors';
import { WebSocket } from 'ws';

const app = express();
expressWs(app);
const port = 8000;

app.use(cors());

const router = express.Router();

const connectedClients: WebSocket[] = [];
let pixels: Pixel[] = [];

interface Pixel {
    x: number;
    y: number;
    color: string;
}

interface IncomingMessage {
    type: string;
    payload: Pixel | Pixel[];
}

router.ws('/canvas', (ws, _req) => {
    connectedClients.push(ws);
    console.log('client connected. Clients total:', connectedClients.length);
    ws.send(JSON.stringify({
        type: 'DEFAULT_PIXELS',
        payload: pixels
    }));

    ws.on('message', (message) => {
        try {
            const decodedMessage = JSON.parse(message.toString()) as IncomingMessage;

            if (decodedMessage.type === 'SET_PIXELS') {
                const {x, y, color} = decodedMessage.payload as Pixel;

                pixels.push({x, y, color});

                connectedClients.forEach(clientWS => {
                    clientWS.send(JSON.stringify({
                        type: 'NEW_PIXEL',
                        payload: {x, y, color}
                    }));
                });
            }
        } catch (e) {
            ws.send(JSON.stringify({ error: 'invalid message' }));
        }
    });

    ws.on('close', () => {
        console.log('client disconnected');
        const index = connectedClients.indexOf(ws);
        connectedClients.splice(index, 1);
    });
});

app.use(router);

app.listen(port, () => {
    console.log(`Server started on port: http://localhost:${port}`);
});