import { Server } from "socket.io";
import env from "../config/index.js";

const io = new Server({
    cors: {
        origin: env.CLIENT_URL
    }
});

export default io;