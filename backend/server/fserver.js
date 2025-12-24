const PORT = process.env.PORT || 5879;
const webSocket = require("ws");
const server = new webSocket.Server({ port: PORT });


server.on("connection", async (socket, req) => {

    console.log("Hallo von Server!");

    socket.on("message", async (event) => {
        let rawData = event;
        console.log("---RAW DATA---:", rawData);

        const a = Buffer.from(rawData)

        console.log('CLIENT STATUS: ', a.toString())

        if (rawData instanceof Blob) {
            rawData = await rawData.text();
        }

        try {
            console.log('')
        } catch (e) {
            console.log("Empfangener Text:", rawData);
        }
    });

    socket.on("close", (_) => {
        console.log('Schließe Verbindung')
    });
});