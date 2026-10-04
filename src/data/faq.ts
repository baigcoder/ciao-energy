import { FAQItem } from '../types';
import { GRIZZLY_FAQ, isTodo } from './brand';

/** Shown while a figure (caffeine, sugar) is not yet confirmed: honest, and never a made-up number. */
export const PENDING_ANSWER = 'We are confirming this figure and will publish it here as soon as it is verified.';

export const FAQ_ITEMS: FAQItem[] = GRIZZLY_FAQ.map((item, index) => ({
  id: `faq-${index + 1}`,
  question: item.q,
  answer: isTodo(item.a) ? PENDING_ANSWER : item.a,
  pending: isTodo(item.a),
}));
