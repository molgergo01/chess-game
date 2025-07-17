import app from './app';
import env from 'chess-game-backend-common/config/env';
import { createServer } from 'node:http';

const PORT = env.PORTS.AUTH || 8082;
const server = createServer(app);

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
