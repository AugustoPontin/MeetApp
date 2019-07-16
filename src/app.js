import express from 'express';
import routes from './routes';

import './database';

class App {
  constructor() {
    this.server = express();

    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.server.use(express.json()); // informa que a comunicacao é json
  }

  routes() {
    this.server.use(routes); // ativa as rotas
  }
}

export default new App().server;
