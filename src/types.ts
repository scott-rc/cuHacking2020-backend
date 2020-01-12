import WebSocket from "ws";

export interface Status {
  stateId: number;
  value: string;
  createdAt: number;
  updatedAt?: number;
}

export interface NewTask {
  title: string;
}

export interface UpdateTask {
  taskId: number;
  title?: string;
  stateId?: string;
}

export interface Task extends NewTask {
  taskId: number;
  stateId: number;
  createdAt: number;
  updatedAt?: number;
}

export interface PuckSession {
  id: string;
  ws: WebSocket;
  puckId: number;
  taskId?: number;
  isAlive: boolean;
}

export interface ClientSession {
  id: string;
  ws: WebSocket;
  isAlive: boolean;
}

export interface Event {
  type: "CLIENT_CONNECT" | "CONNECT" | "POSITION_CHANGE" | "RESET";
  data: {
    id: number;
  };
}

export interface ClientConnectEvent extends Event {
  type: "CLIENT_CONNECT";
}

export interface PuckConnectEvent extends Event {
  type: "CONNECT";
}

export interface PuckPositionChangeEvent extends Event {
  type: "POSITION_CHANGE";
  data: {
    id: number;
    column: number;
  };
}

export interface PuckResetEvent extends Event {
  type: "RESET";
}
