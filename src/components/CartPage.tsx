import React from 'react';
import { CartContents } from './CartContents';

interface CartPageProps {
  onNavigate: (url: string) => void;
}

/** Full-page bag at /cart (same contents as the drawer, for direct links and no-JS-drawer contexts). */
export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => (
  <section className="cart-page" aria-labelledby="page-bag-title">
    <CartContents headingId="page-bag-title" onNavigate={onNavigate} />
  </section>
);
