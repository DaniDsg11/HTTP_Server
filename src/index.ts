import * as net from 'net';
import * as fs from 'fs';

let resources: { [id: string]: any } = {};

const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// Create TCP server
const server = net.createServer((socket) => {
    // Handle incoming data
    socket.on('data', (data) => {
        const request = data.toString();
        const [method, path, ...rest] = request.split(' ');
        console.log('Request:', method, path);
        console.log('Rest:', rest);
        const rawBody = rest.join(' ');
        const startIndex = rawBody.indexOf('{');
        const endIndex = rawBody.lastIndexOf('}');
        
        // Extract the JSON body substring
        const jsonBody = rawBody.substring(startIndex, endIndex + 1);
        console.log('JSON body:', jsonBody);
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
            case '/resources':
                if (method === 'GET') {
                    // Return list of resources
                    const resourceList = Object.keys(resources).map(id => ({ id, data: resources[id] }));
                    const response = {
                        statusCode: 200,
                        body: JSON.stringify(resourceList)
                    };
                    socket.write(`HTTP/1.1 ${response.statusCode}\n${headers.join('\n')}\n\n${response.body}`);
                    socket.end();
                } else if (method === 'POST') {
                    console.log('POST');
                    
                    try {
                        const id = generateId();
                        const parsedJson = JSON.parse(jsonBody);
                        resources[id] = parsedJson;
                        const response = {
                            statusCode: 201,
                            body: JSON.stringify({ id, data: parsedJson })
                        };
                        socket.write(`HTTP/1.1 ${response.statusCode}\n${headers.join('\n')}\n\n${response.body}`);
                    } catch (error) {
                        const response = {
                            statusCode: 400,
                            body: JSON.stringify({ error: 'Bad Request' })
                        };
                        socket.write(`HTTP/1.1 ${response.statusCode}\n${headers.join('\n')}${response.body}`);
                    }
                    socket.end();
                } else {
                    const response = {
                        statusCode: 405,
                        body: JSON.stringify({ error: 'Method Not Allowed' })
                    };
                    socket.write(`HTTP/1.1 ${response.statusCode}\n${headers.join('\n')}${response.body}`);
                    socket.end();
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
const PORT = 3000;

// Start server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
