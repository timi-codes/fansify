import * as Joi from 'joi';
import { IMembership } from '../types';

export const CreateMembershipSchema = Joi.object<IMembership & { quantity: number }>({
  name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().positive().required(),
  quantity: Joi.number().positive().required(),
});
