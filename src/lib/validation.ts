import * as yup from "yup";

export const titleValidator = yup.string().required();

export const eventValidator = yup
  .object({
    type: yup
      .string()
      .oneOf(["POSITION_CHANGE", "AUTOCONNECT"])
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

export const newTaskValidator = yup.object({
  title: titleValidator
});
