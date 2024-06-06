import * as Joi from 'joi';
import { IMembership } from '../types';

export const CreateMembershipSchema = Joi.object<IMembership & { quantity: number }>({
  tag: Joi.string().pattern(/^\S*$/, 'No spaces allowed in tag.').required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().positive().required(),
  quantity: Joi.number().positive().required(),
});
