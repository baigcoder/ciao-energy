/**
 * Privacy page content: one source for the page, its static HTML and its metadata. Every statement
 * describes what this site's code actually does (checked against src/store/cart.ts, src/i18n.tsx,
 * CookieNotice, NewsletterFooter, CheckoutPage and the WebGL moments). Facts about the company that
 * are not confirmed (address, contact email) are not stated here.
 */
export const PRIVACY = {
  title: 'Privacy',
  intro:
    'This site keeps only what it needs to work, and only in your own browser. It uses no analytics, no advertising and no tracking cookies.',
  sections: [
    {
      heading: 'What stays in your browser',
      items: [
        'Your bag, items saved for later and any promo code you applied, so they are still there when you come back (browser local storage).',
        'Your language choice (English or Urdu).',
        'That you have dismissed the storage notice.',
        'For the current visit only: whether the opening animation and the bear’s roar have already played (session storage, cleared when you close the tab).',
      ],
    },
    {
      heading: 'What is not collected',
      items: [
        'No analytics, advertising or social-media trackers are loaded.',
        'Online ordering is not open yet: details entered at checkout are used to show your order summary in this browser and are not sent anywhere.',
        'Newsletter sign-ups are not open yet: an email address entered in the form is not sent or stored.',
      ],
    },
    {
      heading: 'Your choices',
      items: [
        'You can clear everything above at any time by clearing this site’s data in your browser settings.',
        'If your browser blocks storage, the bag still works for the current visit.',
      ],
    },
  ],
  note: 'When online ordering and the newsletter open, this page will be updated before any personal data is collected.',
} as const;
