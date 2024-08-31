import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const route = Router();

route.get('/status', AppController.getStatus);
route.get('/stats', AppController.getStats);

/* user routes */
route.post('/users', UsersController.postNew);
route.get('/users/me', UsersController.getMe);

/* connection routes */
route.get('/connect', AuthController.getConnect);
route.get('/disconnect', AuthController.getDisconnect);

/* file routes */
route.post('/files', FilesController.postUpload);

export default route;