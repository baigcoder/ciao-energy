import { FAQItem } from '../types';
import { GRIZZLY_FAQ, isTodo } from './brand';

/**
 * Published questions only: an answer still marked TODO is left out of the page,
 * the static HTML and the FAQ schema until the brand owner confirms it.
 */
export const FAQ_ITEMS: FAQItem[] = GRIZZLY_FAQ.filter((item) => !isTodo(item.a)).map((item, index) => ({
  id: `faq-${index + 1}`,
  question: item.q,
  answer: item.a,
}));
