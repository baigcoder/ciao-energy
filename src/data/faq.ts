import { FAQItem } from '../types';
import { GRIZZLY_FAQ } from './brand';

export const FAQ_ITEMS: FAQItem[] = GRIZZLY_FAQ.map((item, index) => ({
  id: `faq-${index + 1}`,
  question: item.q,
  answer: item.a,
}));
