import db from "../lib/db";
import logger from "../lib/logger";
import sessions from "../lib/sessions";
import { newTaskValidator } from "../lib/validation";
import { NewTask, Task } from "../types";

export const save = async (task: NewTask): Promise<Task> => {
  logger.continueDebug("validating new task: %o", task);
  const newTask = await newTaskValidator.validate(task);

  logger.continueDebug("saving new task to db...");
  const [createdTask] = await db
    .table("task")
    .insert(newTask)
    .returning("*");

  logger.continueDebug("saved task to the db: %o", createdTask);

  logger.continueDebug("finding session without task...");
  const session = sessions.find(x => x.puckId !== -1 && x.taskId == null);

  if (!session) {
    logger.continueDebug("couldn't find a session without a task");
    return createdTask;
  }

  logger.continueDebug("found a session without a task: %s", session.id);

  logger.continueDebug(
    "emitting UPDATE event to puck: %s (%s)",
    session.puckId,
    session.id
  );

  session.ws.send(
    JSON.stringify({
      event: {
        type: "UPDATE",
        data: {
          title: createdTask.title
        }
      }
    })
  );

  return createdTask;
};
