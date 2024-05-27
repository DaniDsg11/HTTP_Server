import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;
const secret = 'RYC_II';

interface Resources {
    [id: string]: any;
}

let resources: Resources = {};

const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

interface Users {
    [username: string]: string;
}

const users: Users = {
    'user1': 'password1',
    'user': 'password'
};

const apiKeys = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJpYXQiOjE3MTYzMDg2OTUsImV4cCI6MTcxNjMxMjI5NX0.NQ-WbdCaHgPDOhiE90L5Y7CFwiTG0Ne-pCy93ksX7Rc',
    'def',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJpYXQiOjE3MTYzNzM0NjMsImV4cCI6MTcxNjM3NzA2M30.vzcH6wuU6tekDNkvF5M5i1wANyhwGwbn1Eodo-qndYw'
];

// Extend the Express Request type to include the user property
declare module 'express-serve-static-core' {
    interface Request {
        user?: string | object;
    }
}

app.use(bodyParser.json());

// Middleware to log requests
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(new Date().toISOString(), req.method, req.url);
    console.log('Headers: ', req.headers);
    console.log('Body: ', req.body);
    next();
});

// Serve the index.html file
app.get('/', (req: Request, res: Response) => {
    fs.readFile('src/contents/index.html', (err, content) => {
        if (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).type('html').send(content.toString());
        }
    });
});

// List resources
app.get('/f1teams', (req: Request, res: Response) => {
    const resourceList = Object.keys(resources).map(id => ({ id, data: resources[id] }));
    res.status(200).json(resourceList);
});

// JWT Authentication Middleware
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, secret, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Add a new resource
app.post('/f1teams', authenticateJWT, (req: Request, res: Response) => {
    const id = generateId();
    resources[id] = req.body;
    res.status(201).json({ id, data: req.body });
});

// Update a resource
app.put('/f1teams/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (resources[id]) {
        resources[id] = req.body;
        res.status(200).json({ id, data: req.body });
    } else {
        res.status(404).json({ error: 'Resource not found' });
    }
});

// Delete a resource
app.delete('/f1teams/:id', (req: Request, res: Response) => {
    const api_key = req.headers['API_KEY'] as string;
    if (!apiKeys.includes(api_key)) {
        res.status(401).json({ error: 'Unauthorized' });
    } else {
        const { id } = req.params;
        if (resources[id]) {
            delete resources[id];
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Resource not found' });
        }
    }
});

// Login endpoint
app.post('/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        const token = jwt.sign({ username }, secret, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// Handle 404
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
