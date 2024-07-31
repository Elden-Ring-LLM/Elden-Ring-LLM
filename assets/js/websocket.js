const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const filePath = './ER0000.sl2'; // Update this path to your file

// Function to read and send file content to a specific client as binary
const sendFileContent = (client) => {
    fs.readFile(filePath, (err, data) => {
        if (err) throw err;
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

// Watch the file for changes
fs.watch(filePath, (eventType, filename) => {
    if (filename && eventType === 'change') {
        fs.readFile(filePath, (err, data) => {
            if (err) throw err;
            // Broadcast the file content to all connected clients as binary
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'file-change', data: data }));
                }
            });
        });
    }
});

// // Watch the file for changes
// fs.watch(filePath, (eventType, filename) => {
//     if (filename && eventType === 'change') {
//         fs.readFile(filePath, (err, data) => {
//             if (err) throw err;
//             // Broadcast the file content to all connected clients as binary
//             wss.clients.forEach(client => {
//                 if (client.readyState === WebSocket.OPEN) {
//                     client.send(data);
//                 }
//             });
//         });
//     }
// });

// Handle new client connections
wss.on('connection', (ws) => {
    console.log('New client connected');
    // Send the current file content to the new client as binary
    sendFileContent(ws);
});

server.listen(8080, () => {
    console.log('Listening on http://localhost:8080');
});
