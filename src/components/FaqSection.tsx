import React, { useState } from 'react';
import { FAQ_ITEMS } from '../data/faq';
import { audioManager } from '../audio/audioManager';
import { RevealText } from './RevealText';

interface FaqSectionProps {
  isActive: boolean;
}

/** Giant left-aligned title, then a centred accordion (first answer open). */
export const FaqSection: React.FC<FaqSectionProps> = ({ isActive }) => {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <section id="FAQ" className={`home-section faq ${isActive ? 'is-active' : ''}`} aria-labelledby="faq-title">
      <RevealText id="faq-title" className="faq__title display" lines={['Frequently', 'asked questions']} split="lines" />

      <div className="faq__list">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
              <h3 className="faq-item__heading">
                <button
                  type="button"
                  id={`faq-q-${index}`}
                  className="faq-item__question"
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${index}`}
                  onClick={() => {
                    audioManager.play('click');
                    setOpenId(isOpen ? null : item.id);
                  }}
                >
                  <span>{item.question}</span>
                  <svg className="faq-item__icon" viewBox="0 0 13 7" aria-hidden="true">
                    <circle cx="1" cy="1" r="1" />
                    <circle cx="4" cy="3" r="1" />
                    <circle cx="6.5" cy="5.5" r="1" />
                    <circle cx="9" cy="3" r="1" />
                    <circle cx="12" cy="1" r="1" />
                  </svg>
                </button>
              </h3>
              <div
                id={`faq-a-${index}`}
                role="region"
                aria-labelledby={`faq-q-${index}`}
                className="faq-item__answer"
                hidden={!isOpen}
              >
                <p>{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
