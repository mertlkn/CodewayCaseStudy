const { json } = require('body-parser');
const express = require('express'); 

const app = express();

app.use(express.json());
app.use('/api',require('./endpoints/api'));


app.listen(5001);