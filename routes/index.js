const express = require('express');
const route = express.Router();
import { AppController } from '../controllers/AppController';

route.get('/status', AppController.getStatus);
route.get('/stats', AppController.getStats);

module.exports = route;