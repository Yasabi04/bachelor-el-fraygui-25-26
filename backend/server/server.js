const PORT = process.env.PORT || 7879;
const webSocket = require("ws");
const crypto = require("crypto");
const server = new webSocket.Server({ port: PORT });
const { RateLimiterMemory } = require('rate-limiter-flexible');

const rateLimiter = new RateLimiterMemory({
    points: 100, // Anzahl der Verbindungen
    duration: 15 * 60, // In Minuten
});

const WSAdapter = require('../adapters/websocket/ws')
const PrismaDBAdapter = require('../adapters/database/prisma');
const ConnectionManager = require("../shared/handlers/connectionManager");
const PollingHandler = require('../shared/handlers/pollingHandler')

const wsAdapter = new WSAdapter()
const dbAdapter = new PrismaDBAdapter()

const pollingHandler = new PollingHandler(dbAdapter, wsAdapter)
const connectionManager = new ConnectionManager(dbAdapter, pollingHandler)

server.on("connection", async (socket, req) => {
    // IP-Adresse holen
    const ip = req.socket.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];
    
    try {
        await rateLimiter.consume(ip);
    } catch (error) {
        console.log(`Rate limit exceeded for IP: ${ip}`);
        socket.close(1008, 'Too many connections');
        return;
    }

    const connectionId = crypto.randomUUID();

    const urlParams = new URLSearchParams(req.url.split("?")[1]);
    const userId = urlParams.get("userId");

    console.log("Hallo von Server!", { connectionId, userId, ip });

    connectionManager.handleConnection(connectionId, userId)
    
    wsAdapter.addConnection(connectionId, socket)

    socket.on("message", async (event) => {
        let rawData = event;

        const a = Buffer.from(rawData)

        console.log('CLIENT STATUS: ', a.toString())

        if (rawData instanceof Blob) {
            rawData = await rawData.text();
        }
    });

    socket.on("close", (_) => {
        console.log('Schließe Verbindung für: ', connectionId)
        connectionManager.handleDisconnection(connectionId)
        wsAdapter.removeConnection(connectionId)
    });
});
