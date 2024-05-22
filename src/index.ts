import * as net from 'net';
import * as fs from 'fs';
import jwt from 'jsonwebtoken';

const secret = 'RYC_II';

let resources: { [id: string]: any } = {};

const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// Users and Passwords
const users = {
    'user1': 'password1',
    'user': 'password'
};

// Make an array of API Keys
const apiKeys = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJpYXQiOjE3MTYzMDg2OTUsImV4cCI6MTcxNjMxMjI5NX0.NQ-WbdCaHgPDOhiE90L5Y7CFwiTG0Ne-pCy93ksX7Rc',
    'def',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJpYXQiOjE3MTYzNzM0NjMsImV4cCI6MTcxNjM3NzA2M30.vzcH6wuU6tekDNkvF5M5i1wANyhwGwbn1Eodo-qndYw'
];

// Create TCP server
const server = net.createServer((socket) => {
    // Handle incoming data
    socket.on('data', (data) => {
        const request = data.toString();
        const [method, path, ...rest] = request.split(' ');
        const [header, body] = request.split('\r\n\r\n');
        const [requestLine, ...headerLines] = header.split('\r\n');
        // Separe path and query
        const pathWithoutQuery = path.split('/');
        const endpoint = "/"+pathWithoutQuery[1];
        const id = pathWithoutQuery[2];
        // console.log('Path:', endpoint);
        // console.log('Request:', method, pathWithoutQuery);
        const rawBody = rest.join(' ');
        const startIndex = rawBody.indexOf('{');
        const endIndex = rawBody.lastIndexOf('}');
        
        // Extract the JSON body substring
        const jsonBody = rawBody.substring(startIndex, endIndex + 1);
        // console.log('JSON body:', jsonBody);

        const req_headers: { [key: string]: string } = {};
        headerLines.forEach(line => {
            const [key, value] = line.split(': ');
            req_headers[key] = value;
            // console.log('Key:', key, 'Value:', value);
        });
        // console.log('Headers:', req_headers);

        // Set response headers
        const res_headers = [
            'Content-Type: application/json',
            'Connection: close',
            '\n'
        ];

        // Handle endpoints
        switch (endpoint) {
            case '/':
                if(method == 'GET') {
                    fs.readFile('contents/index.html', (err, content) => {
                        if (err) {
                            const response = {
                                statusCode: 500,
                                body: JSON.stringify({ error: 'Internal Server Error' })
                            };
                            socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}${response.body}`);
                            socket.end();
                            console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                        } else {
                            const response = {
                                statusCode: 200,
                                body: content.toString(),
                                contentType: 'text/html'
                            };
                            socket.write(`HTTP/1.1 ${response.statusCode}\nContent-Type: ${response.contentType}\n${res_headers.join('\n')}${response.body}`);
                            socket.end();
                            console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                            // Console log the headers
                            console.log('Headers: ', req_headers);
                            console.log('Body: ', jsonBody, '\n');
                        }
                    });
                } else {
                    const response = {
                        statusCode: 405,
                        body: JSON.stringify({ error: 'Method Not Allowed' })
                    };
                    socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}${response.body}`);
                    console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                    console.log('Headers: ', req_headers);
                    console.log('Body: ', jsonBody, '\n');
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
                    socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}\n\n${response.body}`);
                    socket.end();
                    console.log(new Date().toISOString(), method, endpoint, response.statusCode);
                    console.log('Headers: ', req_headers);
                    console.log('Body: ', jsonBody, '\n');
                } else if (method === 'POST') {
                    console.log('POST');
                    try {
                        const token = req_headers['Authorization'];
                        if (!token) {
                            const response = {
                                statusCode: 401,
                                body: JSON.stringify({ error: 'Unauthorized' })
                            };
                            socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}${response.body}`);
                            socket.end();
                            console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                            console.log('Headers: ', req_headers);
                            console.log('Body: ', jsonBody, '\n');    
                            return;
                        }
                        console.log('Token: ', token);
                        try {
                            jwt.verify(token, secret);
                            const id = generateId();
                            const parsedJson = JSON.parse(jsonBody);
                            resources[id] = parsedJson;
                            const response = {
                                statusCode: 201,
                                body: JSON.stringify({ id, data: parsedJson })
                            };
                            socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}\n\n${response.body}`);
                            console.log(new Date().toISOString(), method, endpoint, response.statusCode);
                            console.log('Headers: ', req_headers);
                            console.log('Body: ', jsonBody, '\n'); 
                        }
                        catch (error) {
                            const response = {
                                statusCode: 403,
                                body: JSON.stringify({ error: 'Forbidden' })
                            };
                            socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}${response.body}`);
                            console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                            console.log('Headers: ', req_headers);
                            console.log('Body: ', jsonBody, '\n');
                        }
                    } catch (error) {
                        const response = {
                            statusCode: 400,
                            body: JSON.stringify({ error: 'Bad Request' })
                        };
                        socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}${response.body}`);
                        console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                        console.log('Headers: ', req_headers);
                        console.log('Body: ', jsonBody, '\n');
                    }
                    socket.end();
                } else if (method === 'PUT') {
                    console.log('PUT');
                    try {
                        const parsedJson = JSON.parse(jsonBody);
                        resources[id] = parsedJson;
                        const response = {
                            statusCode: 200,
                            body: JSON.stringify({ id, data: parsedJson })
                        };
                        socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}\n\n${response.body}`);
                        console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                        console.log('Headers: ', req_headers);
                        console.log('Body: ', jsonBody);
                    } catch (error) {
                        const response = {
                            statusCode: 400,
                            body: JSON.stringify({ error: 'Bad Request' })
                        };
                        socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}${response.body}`);
                        console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                        console.log('Headers: ', req_headers);
                        console.log('Body: ', jsonBody, '\n');
                    }
                    socket.end();
                } else if (method === 'DELETE') {
                    // console.log('DELETE');
                    const api_key = req_headers['API_KEY'];
                    if (!apiKeys.includes(api_key)) {
                        const response = {
                            statusCode: 401,
                            body: JSON.stringify({ error: 'Unauthorized' })
                        };
                        socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}${response.body}`);
                        socket.end();
                        console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                        console.log('Headers: ', req_headers);
                        console.log('Body: ', jsonBody, '\n');
                        return;
                    }                    
                    delete resources[id];
                    const response = {
                        statusCode: 204,
                        body: ''
                    };
                    socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}\n\n${response.body}`);
                    socket.end();
                    console.log(new Date().toISOString(), method, endpoint, response.statusCode);
                    console.log('Headers: ', req_headers);
                    console.log('Body: ', jsonBody, '\n');
                } else {
                    const response = {
                        statusCode: 405,
                        body: JSON.stringify({ error: 'Method Not Allowed' })
                    };
                    socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}${response.body}`);
                    socket.end();
                    console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                    console.log('Headers: ', req_headers);
                    console.log('Body: ', jsonBody, '\n');
                }
                break;
                case '/login':
                    // Do login with JWT
                    // console.log('Login');
                    const parsedJson = JSON.parse(jsonBody);
                    const { username, password } = parsedJson;
                    // console.log('Username:', username);
                    // console.log('Password:', password);

                    // Check if user exists
                    if (Object.keys(users).includes(username) && Object.values(users).includes(password)) {
                        const token = jwt.sign({ username }, secret, { expiresIn: '1h' });
                        console.log('Token: ', token);
                        const response = {
                            statusCode: 200,
                            body: JSON.stringify({ message: 'Login successful', token: token })
                        };
                        // Return JWT token
                        socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}${response.body}`);
                        socket.end();
                        console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                        console.log('Headers: ', req_headers);
                        console.log('Body: ', jsonBody, '\n');
                    } else {
                        const response = {
                            statusCode: 401,
                            body: JSON.stringify({ error: 'Unauthorized' })
                        };
                        socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}${response.body}`);
                        socket.end();
                        console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                        console.log('Headers: ', req_headers);
                        console.log('Body: ', jsonBody, '\n');
                    }
                    break;
                    default:
                        const response = {
                            statusCode: 404,
                            body: JSON.stringify({ error: 'Not Found' })
                        };
                        socket.write(`HTTP/1.1 ${response.statusCode}\n${res_headers.join('\n')}${response.body}`);
                        socket.end();
                        console.log(new Date().toISOString(), method, endpoint, response.statusCode); 
                        console.log('Headers: ', req_headers);
                        console.log('Body: ', jsonBody, '\n');
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
