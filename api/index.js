const express = require('express');
var cors = require('cors');
const { default: mongoose, Mongoose } = require('mongoose');
const User = require('./models/User.js')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require("dotenv").config()
const app = express();


const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "kajsdkjgkawjjth3832ipuiawf"

app.use(cookieParser())
app.use(express.json());
app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173',
}))


mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.once('connected', () => {
    console.log('Connected to MongoDB');
});

db.on('error', (error) => {
    console.error('MongoDB connection error:', error);
});
app.get('/test', (req, res) => {
    res.json("test ok");
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email })
    if (userDoc) {
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (passOk) {
            jwt.sign({
                email: userDoc.email,
                id: userDoc._id,
                
            }, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json
            })
            res.cookie('token', '').json(userDoc)
        }
        else {
            res.status(422).json("pass not ok")
        }
    }
    else {
        res.json('not found')
    }
})

app.get('/profile', async (req, res) => {
    const { token } = req.cookies
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            const {name,email,_id} = await User.findById(userData.id)
            res.json(name,email,_id);
        })
    } else {
        res.json(null);
    }
    res.json({ token })
})

app.post('/register', async (req, res) => {
    console.log("Got a register request!!")
    const { name, email, password } = req.body;
    const userDoc = await User.create({
        name,
        email,
        password: bcrypt.hashSync(password, bcryptSalt),
    })

    res.json(userDoc);
})


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
