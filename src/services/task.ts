import db from "../lib/db";
import logger from "../lib/logger";
import { clientSessions, puckSessions } from "../lib/state";
import { newTaskValidator } from "../lib/validation";
import { NewTask, Task, UpdateTask } from "../types";

export const create = async (task: NewTask): Promise<Task> => {
  logger.continueDebug("validating new task: %o", task);
  const newTask = await newTaskValidator.validate(task);

  logger.continueDebug("saving new task to db...");
  const [createdTask] = await db
    .table("task")
    .insert(newTask)
    .returning("*");

  logger.continueDebug("saved task to the db: %o", createdTask);

  logger.continueDebug("finding session without task...");
  const session = puckSessions.find(x => x.puckId !== -1 && x.taskId == null);

  if (!session) {
    logger.continueDebug("couldn't find a session without a task");
    return createdTask;
  }

  logger.continueDebug("found a session without a task: %s", session.id);

  logger.continueDebug("setting task id on session");
  session.taskId = createdTask.taskId;

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

export const update = async (
  taskId: number,
  updateTask: UpdateTask
): Promise<void> => {
  logger.continueDebug("updating task: %o", updateTask);
  await db
    .table("task")
    .update(updateTask)
    .where({ taskId });

  logger.continueDebug("emitting POSITION_CHANGE event to clients");
  clientSessions.forEach(session => {
    session.ws.send(
      JSON.stringify({
        event: {
          type: "POSITION_CHANGE",
          data: {
            id: updateTask.taskId,
            stateId: updateTask.stateId
          }
        }
      })
    );
  });
};
