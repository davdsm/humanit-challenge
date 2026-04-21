const { z } = require('zod');

const clientBaseSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  taxIdentifier: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().min(1),
});

const createClientSchema = clientBaseSchema;

const updateClientSchema = clientBaseSchema;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

module.exports = {
  createClientSchema,
  updateClientSchema,
  loginSchema,
};
