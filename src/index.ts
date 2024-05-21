import * as net from 'net';

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
                const defaultResponse = {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Welcome to our HTTP server!' })
                };
                const rawResponse = `HTTP/1.1 ${defaultResponse.statusCode}\n${headers.join('\n')}${defaultResponse.body}`;
                socket.write(rawResponse);
                console.log('Request:', request);
                console.log('Response:', defaultResponse);
                console.log('Raw Response:', rawResponse);
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
        socket.end();
    });
});

// Set server port
const PORT = process.env.PORT || 3000;

// Start server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
