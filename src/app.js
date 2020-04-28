const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const chalk = require('chalk');
const morgan = require('morgan');
const socketio = require('socket.io');
const path = require('path');
const { v4: uuid } = require('uuid');
// midddlewares
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');

dotenv.config();
const port = process.env.PORT || 5000;
const env = process.env.NODE_ENV || 'development';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('combined', { stream: logger.stream }));
console.log(path.join(__dirname, '../public'));
app.use(express.static(path.join(__dirname, '../public')));

const server = http.createServer(app);
const io = socketio(server);

app.use(errorHandler);

let users = [];

io.use((socket, next) => {
  const { name, type } = socket.handshake.query;
  console.log(
    `> New user connected: ${chalk.blue(name)} ${chalk.black.bgBlue(
      type
    )} ${chalk.green(socket.id)}`
  );
  const user = { id: uuid(), name, type, socketID: socket.id };
  socket.user = user;
  return next();
});

io.on('connection', socket => {
  const user = socket.user;
  users.push(user);
  console.log(user.name, user.id, user.socketID);
  socket.emit('connected', socket.user);

  io.emit('users', users);

  socket.on('send-signal', res => {
    console.log('> Signal received from: ', res.from);
    console.log('> Signal sending to: ', res.to);
    io.to(res.to.socketID).emit('get-signal', res);
  });

  socket.on('acknowledge-call', res => {
    console.log('> Signal ack from: ', res.from);
    io.to(res.to.socketID).emit('call-acknowledged', res);
  });

  socket.on('disconnect', res => {
    console.log('> Disconnect: ', socket.id);
    console.log(res);
    users = users.filter(user => user.socketID !== socket.id);
    console.log('> Users after disconnect', users);
    io.emit('users', users);
  });
});

server.listen(port, () =>
  console.log(
    `> Server listening on PORT: ${chalk.green(port)}, mode: ${chalk.blue(env)}`
  )
);
