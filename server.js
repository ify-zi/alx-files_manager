import route from './routes/index';

const express = require('express');

const app = express();

const port = process.env.PORT || 5000;
app.use(express.json());
app.use('/', route);

app.listen(port, () => {
  console.log('Server is running on http://127.0.0.1:5000');
});