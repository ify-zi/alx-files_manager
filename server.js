import route from './routes/index';
import express from 'express';

const app = express();

const PORT = process.env.PORT || 5000;
app.use(express.json());

app.use('/', route);

app.listen(PORT, () => {
  console.log('Server is running on http://127.0.0.1:5000');
});

export default app;