import { Router } from 'express';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.get('/users', UserController.index);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// Daqui pra baixo precisa de autentica��o
routes.use(authMiddleware);

routes.put('/users', UserController.update);

// exporta as rotas
export default routes;
