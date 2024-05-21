import * as net from 'net';
import * as fs from 'fs';

// Create TCP server
const server = net.createServer((socket) => {
    // Handle incoming data
    socket.on('data', (data) => {
        const request = data.toString();
        const [method, path, ...rest] = request.split(' ');

        // Set response headers
        const headers = [
            'Content-Type: application/json',
            'Connection: close',
            '\n'
        ];

        // Handle endpoints
        switch (path) {
            case '/':
                if(method == 'GET') {
                    fs.readFile('contents/index.html', (err, content) => {
                        if (err) {
                            const response = {
                                statusCode: 500,
                                body: JSON.stringify({ error: 'Internal Server Error' })
                            };
                            socket.write(`HTTP/1.1 ${response.statusCode}\n${headers.join('\n')}${response.body}`);
                            socket.end();
                        } else {
                            const response = {
                                statusCode: 200,
                                body: content.toString(),
                                contentType: 'text/html'
                            };
                            socket.write(`HTTP/1.1 ${response.statusCode}\nContent-Type: ${response.contentType}\n${headers.join('\n')}${response.body}`);
                            socket.end();
                        }
                    });
                } else {
                    const response = {
                        statusCode: 405,
                        body: JSON.stringify({ error: 'Method Not Allowed' })
                    };
                    socket.write(`HTTP/1.1 ${response.statusCode}\n${headers.join('\n')}${response.body}`);
                }
                break;
            default:
                // Return the appropriate error codes if the endpoints are not invoked correctly
                const response = {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'Not Found' })
                };
                socket.write(`HTTP/1.1 ${response.statusCode}\n${headers.join('\n')}${response.body}`);
        }

        // Close the connection
        // socket.end();
    });
});

// Set server port
const PORT = process.env.PORT || 3000;

// Start server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
