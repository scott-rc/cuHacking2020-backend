require("dotenv").config();
import express from "express";
import http from "http";
import middleware from "./lib/middleware";
import router from "./lib/router";
import websocket from "./lib/websocket";

const app = router(middleware(express()));
const server = websocket(http.createServer(app));

server.listen(process.env.PORT, () => {
  console.log(`listenting on port ${process.env.PORT}`);
});
