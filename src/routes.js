import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';
import SubscriptionController from './app/controllers/SubscriptionController';
import OrganizingController from './app/controllers/OrganizingController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.get('/users', UserController.index);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// Daqui pra baixo precisa de autenticação
routes.use(authMiddleware);

routes.put('/users', UserController.update);

routes.get('/organizings', OrganizingController.index);

routes.get('/meetups', MeetupController.index);
routes.post('/meetups', MeetupController.store);
routes.put('/meetups/:id', MeetupController.update);
routes.delete('/meetups/:id', MeetupController.delete);

routes.get('/subscription', SubscriptionController.index);
routes.post('/subscription', SubscriptionController.store);

routes.post('/files', upload.single('file'), FileController.store);

// exporta as rotas
export default routes;
