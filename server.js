const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = 3001;
const JWT_SECRET = 'etherx-secret-key';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'etherx-enhanced.html'));
});

app.get('/otp-auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'otp', 'index.html'));
});

app.use('/otp', express.static(path.join(__dirname, 'otp')));

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

// OTP Storage and Email Configuration
const otpStore = new Map();

const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP requests from this IP, please try again later.' }
});

// OTP Routes
app.post('/api/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email, type } = req.body;
    
    if (!email || !type) {
      return res.status(400).json({ success: false, message: 'Email and type are required' });
    }
    
    const otp = generateOTP();
    const otpData = {
      otp,
      email,
      type,
      createdAt: Date.now(),
      expiresAt: Date.now() + 2 * 60 * 1000
    };
    
    otpStore.set(email, otpData);
    
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
      const transporter = createTransporter();
      const mailOptions = {
        from: { name: 'EtherX OneNote', address: process.env.EMAIL_USER },
        to: email,
        subject: type === 'signup' ? 'Verify Your Email - OTP Code' : 'Login Verification - OTP Code',
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;"><h2>${type === 'signup' ? 'Welcome! Verify Your Email' : 'Login Verification'}</h2><div style="background: white; color: #333; padding: 20px; border-radius: 10px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 3px; text-align: center;">${otp}</div><p><strong>This OTP will expire in 2 minutes.</strong></p></div>`
      };
      
      await transporter.sendMail(mailOptions);
    }
    
    console.log(`OTP sent to ${email}: ${otp}`);
    res.json({ success: true, message: 'OTP sent successfully', otp: otp });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp, type } = req.body;
    
    if (!email || !otp || !type) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and type are required' });
    }
    
    const storedOTPData = otpStore.get(email);
    
    if (!storedOTPData) {
      return res.status(400).json({ success: false, message: 'No OTP found for this email' });
    }
    
    if (Date.now() > storedOTPData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }
    
    if (storedOTPData.otp !== otp || storedOTPData.type !== type) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    otpStore.delete(email);
    
    // Create or update user
    if (type === 'signup') {
      const hashedPassword = await bcrypt.hash('default', 10);
      writeUserData(email, { username: email.split('@')[0], email, password: hashedPassword });
      writeNotes(email, []);
    }
    
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, message: 'OTP verified successfully', token });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// Clean up expired OTPs
setInterval(() => {
  const now = Date.now();
  for (const [email, otpData] of otpStore.entries()) {
    if (now > otpData.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 60000);

app.listen(PORT, () => {
  console.log(`✅ EtherX Backend Server running on http://localhost:${PORT}`);
  console.log(`📝 Ready to handle user authentication and notes!`);
  console.log(`🔐 OTP Authentication system integrated`);
});