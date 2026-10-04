import { Benefit, BenefitIconType } from '../types';
import { GRIZZLY_BENEFITS } from './brand';

/** The four benefits, in label order (also drives the can spotlight blocks). */
export const BENEFITS: Benefit[] = GRIZZLY_BENEFITS.map((benefit, index) => ({
  id: `benefits-${index + 1}`,
  chapter: index + 1,
  spec: benefit.spec,
  title: benefit.title,
  titleLine1: benefit.lines[0].toUpperCase(),
  titleLine2: benefit.lines[1]?.toUpperCase(),
  description: benefit.description,
  iconType: benefit.icon as BenefitIconType,
}));
