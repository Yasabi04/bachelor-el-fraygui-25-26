class WsAdapter {
    constructor() {
        this.connections = new Map();
    }

    /**
     * Register a new WebSocket connection
     * @param {string} connectionId - Unique identifier
     * @param {WebSocket} ws - WebSocket instance
     * @param {Function} onClose - Cleanup callback
     * @param {Function} onError - Error callback
     */
    addConnection(connectionId, ws, onClose, onError) {
        this.connections.set(connectionId, ws);
        console.log(`Hallo ${connectionId}!`)

        ws.on("error", (error) => {
            console.error(
                `[WsAdapter] WebSocket error for ${connectionId}:`,
                error
            );
            this.cleanup(connectionId);
            if (onError) {
                onError(connectionId, error);
            }
        });

        ws.on("close", (code, reason) => {
            console.log(
                `[WsAdapter] Connection closed: ${connectionId}, code: ${code}`
            );
            this.cleanup(connectionId);
            if (onClose) {
                onClose(connectionId);
            }
        });

        ws.on("pong", () => {
            ws.isAlive = true;
        });
    }

    cleanup(connectionId) {
        const ws = this.connections.get(connectionId);
        if (ws) {
            ws.removeAllListeners("error");
            ws.removeAllListeners("close");
            ws.removeAllListeners("pong");
            this.connections.delete(connectionId);
        }
    }

    removeConnection(connectionId) {
        const ws = this.connections.get(connectionId);
        if (ws) {
            ws.close(1000, "Server closed connection");
            this.cleanup(connectionId);
        }
    }

    async postToConnection(connectionId, data) {

        const ws = this.connections.get(connectionId);

        if (!ws) {
            return { success: false, gone: true };
        }

        // WebSocket.OPEN = 1
        if (ws.readyState !== 1) {
            this.cleanup(connectionId);
            return { success: false, gone: true };
        }

        return new Promise((resolve) => {
            try {
                const message = Buffer.isBuffer(data) ? data : data;
                console.log('Kurz vor ws.send:', message.timestamp)
                // console.log('WSADAPTER: ' + message)
                ws.send(message, (error) => {
                    if (error) {
                        console.error(
                            `[WsAdapter] Send error to ${connectionId}:`,
                            error
                        );
                        resolve({ success: false, gone: false });
                    } else {
                        resolve({ success: true });
                    }
                });
            } catch (error) {
                console.error(
                    `[WsAdapter] Exception sending to ${connectionId}:`,
                    error
                );
                resolve({ success: false, gone: false });
            }
        });
    }

    async broadcast(data, excludeConnectionId = null) {
        const results = [];

        if (this.getConnectionCount() > 0) {
            for (const [connectionId] of this.connections) {
                if (connectionId === excludeConnectionId) continue;

                const result = await this.postToConnection(connectionId, data);
                results.push({ connectionId, ...result });
            }

            return results;
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.connections.forEach((ws, connectionId) => {
                if (ws.isAlive === false) {
                    console.log(
                        `[WsAdapter] Schließen von getrennter Verbindung: ${connectionId}`
                    );
                    return this.removeConnection(connectionId);
                }

                ws.isAlive = false;
                ws.ping();
            });
        }, 15000);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
    }

    getConnectionCount() {
        return this.connections.size;
    }

    closeAll() {
        this.connections.forEach((ws, connectionId) => {
            this.removeConnection(connectionId);
        });
        this.stopHeartbeat();
    }
}

module.exports = WsAdapter;