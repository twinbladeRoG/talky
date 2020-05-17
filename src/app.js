const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const chalk = require('chalk');
const morgan = require('morgan');
const socketio = require('socket.io');
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

const server = http.createServer(app);
const io = socketio(server);
app.use(errorHandler);

let users = [];

io.use((socket, next) => {
  const { name, room } = socket.handshake.query;
  console.log(
    `> New user connected: ${chalk.blue(name)} ${chalk.cyan(
      room
    )} ${chalk.green(socket.id)}`
  );
  const user = {
    id: uuid(),
    name,
    room,
    socketID: socket.id
  };
  socket.user = user;
  socket.room = room;
  return next();
});

io.on('connection', socket => {
  users.push(socket.user);
  socket.join(socket.room, () => {
    socket
      .in(socket.room)
      .emit('join-room', `${socket.user.name} has joined ${socket.room}`);
    console.log(socket.rooms);
    io.in(socket.room).emit(
      'users',
      users.filter(({ room }) => room === socket.room)
    );
  });

  socket.emit('connected', socket.user);

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
    // console.log(res);
    users = users.filter(user => user.socketID !== socket.id);
    // console.log('> Users after disconnect', users);
    io.emit('users', users);
  });
});

server.listen(port, () =>
  console.log(
    `> Server listening on PORT: ${chalk.green(port)}, mode: ${chalk.blue(env)}`
  )
);
