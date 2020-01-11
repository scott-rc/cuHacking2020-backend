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
  status: Status;
  createdAt: number;
  updatedAt?: number;
}
