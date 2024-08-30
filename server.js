const express = require('express');
const app = express();
const port = 5000;
import { route } from "./routes/index";

app.use('/', route);

app.listen(port, () => {
  console.log(`Server is running on http://127.0.0.1:5000`)
})