import Joi from 'joi';

export default {
  limit: () =>
    Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20),
  skip: () =>
    Joi.number()
      .integer()
      .min(0)
      .default(0),
  offset: () =>
    Joi.number()
      .integer()
      .min(0)
      .default(0),
};
