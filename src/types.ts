import WebSocket = require("ws");

export interface Status {
  statusId: number;
  value: string;
  createdAt: number;
  updatedAt?: number;
}

export interface NewTask {
  title: string;
}

export interface Task extends NewTask {
  taskId: number;
  statusId: number;
  createdAt: number;
  updatedAt?: number;
}

export interface Session {
  id: string;
  ws: WebSocket;
  puckId: number;
  taskId?: number;
  isAlive: boolean;
}
