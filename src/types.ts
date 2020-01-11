export type Status = {
  statusId: number;
  value: string;
};

export type Task = {
  taskId: number;
  title: string;
  status: Status;
};

export type Create = {
  title: string;
};
