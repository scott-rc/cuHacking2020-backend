import * as yup from "yup";

export const titleValidator = yup.string().required();
export const stateIdValidator = yup
  .number()
  .required()
  .oneOf([-1, 1, 2, 3]);

export const eventValidator = yup
  .object({
    type: yup
      .string()
      .oneOf(["CLIENT_CONNECT", "POSITION_CHANGE", "CONNECT", "RESET"])
      .required(),
    data: yup
      .object({
        id: yup
          .number()
          .positive()
          .required()
      })
      .required()
  })
  .required();

export const positionChangeEventValidator = eventValidator.concat(
  yup.object({
    data: yup.object({
      column: stateIdValidator
    })
  })
);

export const newTaskValidator = yup.object({
  title: titleValidator
});

export const updateTaskValidator = yup.object({
  title: titleValidator.notRequired(),
  stateId: stateIdValidator.notRequired()
});
