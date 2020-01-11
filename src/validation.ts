import yup from "yup";

export const titleValidator = yup.string().required();

export const createValidator = yup.object({
  title: titleValidator
});
