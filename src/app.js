const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');
const dmRoutes = require('./routes/dm.routes');
// const reportRoutes = require('./routes/report.routes'); //  아직 없음

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/dm', dmRoutes);
// app.use('/report', reportRoutes); //

app.get('/', (req, res) => {
    res.send('Safe SNS API is running');
});

module.exports = app;