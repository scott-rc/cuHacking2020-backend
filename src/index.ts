require("dotenv").config();
import express from "express";
import http from "http";
import WebSocket from "ws";

const app = express();
const server = http.createServer(app);

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, ws => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws, request) => {
  console.log("socket connected", ws, request);

  ws.on("message", message => {
    console.log(`Received message ${message}`);
    ws.send(message);
  });

  ws.on("close", () => {
    console.log("socket disconnected");
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`listenting on port ${port}`);
});
