import db from "../lib/db";
import { newTaskValidator } from "../lib/validation";
import { NewTask, Task } from "../types";

export const save = async (task: NewTask): Promise<Task> => {
  const newTask = await newTaskValidator.validate(task);

  const [createdTask] = await db
    .table("task")
    .insert(newTask)
    .returning("*");

  return createdTask;
};
