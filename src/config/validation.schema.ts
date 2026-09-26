import Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  PORT: Joi.number()
    .port()
    .default(3000),

  API_PREFIX: Joi.string()
    .trim()
    .default('api/v1'),

  APP_NAME: Joi.string()
    .trim()
    .min(1)
    .default('echogpt-backend'),

  APP_BASE_URL: Joi.string()
    .uri()
    .default('http://localhost:3000'),

  CORS_ORIGINS: Joi.string()
    .default('http://localhost:3000'),

  LOG_LEVEL: Joi.string()
    .valid(
      'error',
      'warn',
      'log',
      'debug',
      'verbose',
    )
    .default('debug'),

  THROTTLE_TTL: Joi.number()
    .integer()
    .positive()
    .default(60000),

  THROTTLE_LIMIT: Joi.number()
    .integer()
    .positive()
    .default(100),

  DATABASE_URL: Joi.string()
    .uri()
    .required(),

  DIRECT_DATABASE_URL: Joi.string()
    .uri()
    .required(),

  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .required(),

  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required(),

  JWT_ACCESS_TTL: Joi.number()
    .integer()
    .positive()
    .default(900),

  JWT_REFRESH_TTL: Joi.number()
    .integer()
    .positive()
    .default(604800),
});