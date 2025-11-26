const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'etherx-secret-key';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const getUserFile = (email) => path.join(DATA_DIR, `${email.replace('@', '_at_')}.json`);
const getNotesFile = (email) => path.join(DATA_DIR, `notes_${email.replace('@', '_at_')}.json`);

const readUserData = (email) => {
  try {
    const data = fs.readFileSync(getUserFile(email), 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const writeUserData = (email, data) => {
  fs.writeFileSync(getUserFile(email), JSON.stringify(data, null, 2));
};

const readNotes = (email) => {
  try {
    const data = fs.readFileSync(getNotesFile(email), 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writeNotes = (email, notes) => {
  fs.writeFileSync(getNotesFile(email), JSON.stringify(notes, null, 2));
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (readUserData(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    writeUserData(email, { username, email, password: hashedPassword });
    writeNotes(email, []);

    res.json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = readUserData(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { username: user.username, email } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/notes', authenticateToken, (req, res) => {
  const notes = readNotes(req.user.email);
  res.json(notes);
});

app.post('/api/notes', authenticateToken, (req, res) => {
  const notes = readNotes(req.user.email);
  const newNote = { ...req.body, id: Date.now(), created: new Date().toISOString() };
  notes.unshift(newNote);
  writeNotes(req.user.email, notes);
  res.json(newNote);
});

app.put('/api/notes/:id', authenticateToken, (req, res) => {
  const notes = readNotes(req.user.email);
  const index = notes.findIndex(n => n.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Note not found' });
  
  notes[index] = { ...notes[index], ...req.body };
  writeNotes(req.user.email, notes);
  res.json(notes[index]);
});

app.delete('/api/notes/:id', authenticateToken, (req, res) => {
  const notes = readNotes(req.user.email);
  const filtered = notes.filter(n => n.id != req.params.id);
  writeNotes(req.user.email, filtered);
  res.json({ message: 'Note deleted' });
});

app.listen(PORT, () => {
  console.log(`✅ EtherX Backend Server running on http://localhost:${PORT}`);
  console.log(`📝 Ready to handle user authentication and notes!`);
});