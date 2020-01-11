import db from "../lib/db";
import { newTaskValidator } from "../lib/validation";
import { NewTask } from "../types";

export const save = async (newTask: NewTask): Promise<void> => {
  const task = await newTaskValidator.validate(newTask);
  await db.table("task").insert(task);
};
