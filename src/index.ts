import express from "express";
import http from "http";
import socketio from "socket.io";
import uuid from "uuid";
import event from "./event";
import { User } from "./types";

const app = express();
const server = http.createServer(app);
const io = socketio(server);
let users: User[] = [];

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

io.on("connection", socket => {
  console.log("user connected");
  users.push({ uuid: uuid.v4(), socketId: socket.id });

  socket.on(event.createdTask, message => {
    console.log(`received "${event.createdTask}":`, message);
  });

  socket.on(event.movedTask, message => {
    console.log(`received "${event.movedTask}":`, message);
  });

  socket.on(event.deletedTask, message => {
    console.log(`received "${event.deletedTask}"`, message);
  });

  socket.on(event.renamedTask, message => {
    console.log(`received "${event.renamedTask}"`, message);
  });

  socket.on(event.resetBoard, message => {
    console.log(`received "${event.resetBoard}"`, message);
  });

  socket.on("disconnected", () => {
    console.log("user disconnected");
    users = users.filter(u => u.socketId == socket.id);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`listenting on port ${port}`);
});
