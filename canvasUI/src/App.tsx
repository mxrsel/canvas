import {FormEvent, useEffect, useRef, useState} from 'react';

interface Pixel {
    x: number;
    y: number;
    color: string;
    username: string;
}

interface DrawData {
    type: string;
    payload: Pixel | Pixel[] | string;
}

const App = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const [username, setUsername] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:8000/canvas');
        ws.current.onclose = () => console.log('connection closed');
        ws.current.onmessage = event => {
            const decodedMessage = JSON.parse(event.data) as DrawData;

            if (decodedMessage.type === 'DEFAULT_PIXELS') {
                const canvas = canvasRef.current;
                if (canvas) {
                    const canvasRender = canvas.getContext('2d');
                    if (canvasRender) {
                        (decodedMessage.payload as Pixel[]).forEach(pixel => {
                            canvasRender.fillStyle = pixel.color;
                            canvasRender.fillRect(pixel.x, pixel.y, 4, 4);
                        });
                    }
                }
            } else if (decodedMessage.type === 'NEW_PIXEL') {
                const canvas = canvasRef.current;
                if (canvas) {
                    const canvasRender = canvas.getContext('2d');
                    if (canvasRender) {
                        const { x, y, color } = decodedMessage.payload as Pixel;
                        canvasRender.fillStyle = color;
                        canvasRender.fillRect(x, y, 4, 4);
                    }
                }
            }
        };

        return () => {
            if (ws.current) {
                ws.current.close();
                console.log('connection closed');
            }
        };
    }, []);

    const handleCanvasDraw = (x: number, y: number, color: string) => {
        if (ws.current) {
            ws.current.send(JSON.stringify({
                type: 'SET_PIXELS',
                payload: {x, y, color, username}
            }));
        }
    };

    const handleSetUsername = (e: FormEvent) => {
        e.preventDefault();
        if (ws.current) {
            ws.current.send(JSON.stringify({
                type: 'SET_USERNAME',
                payload: username
            }));
            setIsLoggedIn(true);
        }
    };

    return (
        <div>
            <h5>Canvas</h5>
            {!isLoggedIn ? (
                <form onSubmit={handleSetUsername}>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                    />
                    <button type="submit">Log In</button>
                </form>
            ) : (
                <div>
                    <p>Logged in as: {username}</p>
                    <canvas
                        ref={canvasRef}
                        width={900}
                        height={700}
                        onMouseMove={(e) => {
                            const canvas = canvasRef.current;
                            if (canvas) {
                                const clientRect = canvas.getBoundingClientRect();
                                const x = e.clientX - clientRect.left;
                                const y = e.clientY - clientRect.top;

                                const canvasRender = canvas.getContext('2d');
                                if (canvasRender) {
                                    canvasRender.fillStyle = '#000000';
                                    canvasRender.fillRect(x, y, 4, 4);
                                    handleCanvasDraw(x, y, '#000000');
                                }
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default App;