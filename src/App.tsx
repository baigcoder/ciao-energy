import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FLAVORS } from './data/flavors';
import { getProductBySlug } from './data/products';
import { SceneManager } from './webgl/sceneManager';
import { Preloader } from './components/Preloader';
import { audioManager } from './audio/audioManager';
import { CiaoHeader } from './components/CiaoHeader';
import { MenuDrawer } from './components/MenuDrawer';
import { SiteFrame } from './components/SiteFrame';
import { StageBackdrop } from './components/StageBackdrop';
import { Atmosphere } from './components/Atmosphere';
import { HeroCarousel } from './components/HeroCarousel';
import { ProfileSection } from './components/ProfileSection';
import { BenefitsSection } from './components/BenefitsSection';
import { ArgumentSection } from './components/ArgumentSection';
import { FullGammeSection } from './components/FullGammeSection';
import { FaqSection } from './components/FaqSection';
import { NewsletterFooter, SiteFooter } from './components/NewsletterFooter';
import { FallbackStage } from './components/FallbackStage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CartDrawer } from './components/CartDrawer';
import { CartPage } from './components/CartPage';
import { CheckoutPage } from './components/CheckoutPage';
import { PackBuilder } from './components/PackBuilder';
import { HalalPage } from './components/HalalPage';
import { NotFoundPage } from './components/NotFoundPage';
import { FlavorFinder } from './components/FlavorFinder';
import { StoreLocator } from './components/StoreLocator';
import { PointerFX } from './components/PointerFX';
import { CookieNotice } from './components/CookieNotice';
import type { MenuItem } from './components/MenuDrawer';
import { useCart } from './store/cart';
import { useSmoothScroll, prefersReducedMotion } from './hooks/useSmoothScroll';
import { useHomeScroll } from './hooks/useHomeScroll';

export type AppRoute =
  | { type: 'HOME' }
  | { type: 'CART' }
  | { type: 'CHECKOUT' }
  | { type: 'MIX' }
  | { type: 'HALAL' }
  | { type: 'STORES' }
  | { type: 'NOT_FOUND' }
  | { type: 'PRODUCT'; slug: string };

const STATIC_ROUTES: Record<string, AppRoute> = {
  '/': { type: 'HOME' },
  '/cart': { type: 'CART' },
  '/checkout': { type: 'CHECKOUT' },
  '/mix': { type: 'MIX' },
  '/halal-zamzam': { type: 'HALAL' },
  '/stores': { type: 'STORES' },
};

function parseCurrentRoute(): AppRoute {
  if (typeof window === 'undefined') return { type: 'HOME' };
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (STATIC_ROUTES[path]) return STATIC_ROUTES[path];
  const product = path.match(/^\/products?\/([^/]+)$/);
  if (product) return { type: 'PRODUCT', slug: product[1] };
  if (path === '/shop') {
    // Retired shop page: send old links to the range on the home page.
    window.history.replaceState(null, '', '/#gamme');
    return { type: 'HOME' };
  }
  return { type: 'NOT_FOUND' };
}

/** Scene mode per route: the home story, a single product can, or nothing (plain pages). */
const sceneRoute = (route: AppRoute) => (route.type === 'PRODUCT' ? 'PRODUCT' : route.type === 'HOME' ? 'HOME' : 'PAGE');

function getInitialFlavorIndex(): number {
  if (typeof window === 'undefined') return 0;
  const slug = window.location.hash.toLowerCase().match(/(?:^|[#&])flavor=([^&]+)/)?.[1];
  const index = slug ? FLAVORS.findIndex((flavor) => flavor.id === slug) : -1;
  return index >= 0 ? index : 0;
}



export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [route, setRoute] = useState<AppRoute>(parseCurrentRoute);
  const [activeIndex, setActiveIndex] = useState<number>(getInitialFlavorIndex);
  const initialFlavorIndexRef = useRef(activeIndex);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [webGlAvailable, setWebGlAvailable] = useState(true);

  const { isOpen: isCartOpen, toggleCart } = useCart();
  const isHome = route.type === 'HOME';
  const { scrollToElement } = useSmoothScroll(isHome && isReady, '.home > .home-section:not(.faq)');
  const { scene, chapter, sectionIndex } = useHomeScroll(isHome, sceneManagerRef);

  const navigate = useCallback((targetUrl: string) => {
    const previous = parseCurrentRoute();
    window.history.pushState(null, '', targetUrl);
    const next = parseCurrentRoute();
    const sm = sceneManagerRef.current;
    // Coming back from a product: focus that flavor in the ring.
    if (previous.type === 'PRODUCT' && next.type === 'HOME') {
      const index = FLAVORS.findIndex((flavor) => flavor.id === previous.slug);
      if (index >= 0) {
        sm?.setInitialFlavor(index);
        setActiveIndex(index);
      }
    }
    setRoute(next);
    sm?.setRoute(sceneRoute(next), next.type === 'PRODUCT' ? next.slug : undefined);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const hash = new URL(targetUrl, window.location.origin).hash.slice(1);
    if (hash) {
      // Wait for the target route to render, then jump to the section.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'instant' }))
      );
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const next = parseCurrentRoute();
      setRoute(next);
      sceneManagerRef.current?.setRoute(sceneRoute(next), next.type === 'PRODUCT' ? next.slug : undefined);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // WebGL scene (client only). Falls back to the static stage when unavailable.
  useEffect(() => {
    const canvas = canvasRef.current;
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!canvas || !gl) {
      setWebGlAvailable(false);
      setIsReady(true);
      return;
    }

    let readyFrame = 0;
    try {
      const packshotSlug = new URLSearchParams(window.location.search).get('packshot');
      const sm = new SceneManager(canvas, Boolean(packshotSlug));
      sceneManagerRef.current = sm;
      if (!packshotSlug) {
        const isMobile = window.innerWidth < 768;
        const cores = navigator.hardwareConcurrency || 4;
        const quality = prefersReducedMotion() ? 'LOW' : isMobile || cores <= 4 ? 'MEDIUM' : 'HIGH';
        sm.setQuality(quality);
        sm.reducedMotion = prefersReducedMotion();
        document.documentElement.dataset.quality = quality;
        sm.onQualityChange = (level) => {
          document.documentElement.dataset.quality = level;
        };
      }
      const initial = parseCurrentRoute();
      if (packshotSlug) sm.setRoute('PRODUCT', packshotSlug);
      else sm.setRoute(sceneRoute(initial), initial.type === 'PRODUCT' ? initial.slug : undefined);
      sm.setInitialFlavor(initialFlavorIndexRef.current);
      if (!packshotSlug && initial.type === 'HOME') sm.armIntro();
      sm.onRoar = () => {
        audioManager.play('growl');
        document.documentElement.dispatchEvent(new CustomEvent('grizzly:roar'));
      };
      const unsubscribe = sm.carousel.onChanged(({ index }) => setActiveIndex(index));
      readyFrame = requestAnimationFrame(() => {
        readyFrame = requestAnimationFrame(() => setIsReady(true));
      });
      return () => {
        cancelAnimationFrame(readyFrame);
        unsubscribe();
        if (sceneManagerRef.current === sm) sceneManagerRef.current = null;
        sm.dispose();
      };
    } catch {
      setWebGlAvailable(false);
      setIsReady(true);
    }
  }, []);

  // Flavor drives the colour tokens ([data-flavor]) and a shareable hash.
  useEffect(() => {
    const flavor = FLAVORS[activeIndex % FLAVORS.length];
    const productFlavor = route.type === 'PRODUCT' ? getProductBySlug(route.slug)?.slug : undefined;
    document.documentElement.dataset.flavor = productFlavor ?? flavor.id;
    if (isHome && !/#(faq|newsletter|benefits)/i.test(window.location.hash)) {
      window.history.replaceState(null, '', `#flavor=${flavor.id}`);
    }
  }, [activeIndex, route, isHome]);

  // Document title per route.
  useEffect(() => {
    const product = route.type === 'PRODUCT' ? getProductBySlug(route.slug) : undefined;
    document.title = product
      ? `${product.name} – Grizzly Energy`
      : route.type === 'PRODUCT'
        ? 'Flavor not found – Grizzly Energy'
        : ({
            CART: 'Your bag – Grizzly Energy',
            CHECKOUT: 'Checkout – Grizzly Energy',
            MIX: 'Mix your pack – Grizzly Energy',
            HALAL: 'Halal and Zamzam – Grizzly Energy',
            STORES: 'Find a store – Grizzly Energy',
            NOT_FOUND: 'Page not found – Grizzly Energy',
            HOME: 'Grizzly Energy – Fuel your wild side',
          } as Record<string, string>)[route.type] ?? 'Grizzly Energy – Fuel your wild side';
    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.content = content;
    };
    const description = product
      ? `${product.name}: ${product.tagline} Natural caffeine, electrolytes and B vitamins.`
      : 'Grizzly Energy: natural caffeine, natural electrolytes, B vitamins and added Zamzam water. Six flavors.';
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', document.title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', `/social/${product?.slug ?? 'blue-raspberry'}.png`);
  }, [route]);

  // Product page scroll moves the can away with the hero on narrow screens.
  useEffect(() => {
    if (route.type !== 'PRODUCT') return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => sceneManagerRef.current?.setProductScroll(window.scrollY / window.innerHeight));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [route]);

  // Keep the focused hero can between the header logo and the flavor title at every viewport size.
  useEffect(() => {
    if (!isHome) return;
    const title = document.querySelector<HTMLElement>('.hero__title-wrap');
    if (!title) return;
    const update = () => {
      const top = title.getBoundingClientRect().top + window.scrollY;
      const logo = document.querySelector<HTMLElement>('.site-logo');
      sceneManagerRef.current?.setHeroSafeBottom(top, logo ? logo.getBoundingClientRect().bottom : 0);
      const slider = document.querySelector<HTMLElement>('.flavor-slider');
      if (slider) sceneManagerRef.current?.setPedestalBand(slider.getBoundingClientRect().bottom + window.scrollY + 8, window.innerHeight - 4);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(title);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [isHome, isReady]);

  // Benefit chapters light one block of the can label in the flavor colour.
  useEffect(() => {
    sceneManagerRef.current?.setBenefitGlow(chapter);
  }, [chapter]);

  const selectFlavor = useCallback((index: number) => {
    if (sceneManagerRef.current) sceneManagerRef.current.carousel.goTo(index);
    else setActiveIndex(index);
  }, []);

  const stepFlavor = useCallback((direction: 1 | -1) => {
    const sm = sceneManagerRef.current;
    if (sm) {
      if (direction > 0) sm.carousel.next();
      else sm.carousel.previous();
    } else {
      setActiveIndex((previous) => (previous + direction + FLAVORS.length) % FLAVORS.length);
    }
  }, []);

  const scrollToSection = useCallback(
    (sectionId: string) => {
      const element = document.getElementById(sectionId);
      if (element) scrollToElement(element);
    },
    [scrollToElement]
  );

  const goToSection = useCallback(
    (sectionId: string) => (isHome ? scrollToSection(sectionId) : navigate(`/#${sectionId}`)),
    [isHome, navigate, scrollToSection]
  );

  const menuItems: MenuItem[] = [
    { key: 'range', href: '/#gamme', onSelect: () => goToSection('gamme') },
    { key: 'benefits', href: '/#benefits-1', onSelect: () => goToSection('benefits-1') },
    { key: 'mix', href: '/mix', onSelect: () => navigate('/mix') },
    { key: 'finder', href: '/#gamme', onSelect: () => setIsFinderOpen(true) },
    { key: 'halal', href: '/halal-zamzam', onSelect: () => navigate('/halal-zamzam') },
    { key: 'stores', href: '/stores', onSelect: () => navigate('/stores') },
    { key: 'faq', href: '/#FAQ', onSelect: () => goToSection('FAQ') },
    { key: 'newsletter', href: '/#newsletter', onSelect: () => goToSection('newsletter') },
  ];

  // The finder recommends from anywhere: go home and spin the ring to the match.
  const handleRecommend = useCallback(
    (index: number) => {
      if (!isHome) navigate('/#gamme');
      requestAnimationFrame(() => selectFlavor(index));
    },
    [isHome, navigate, selectFlavor]
  );

  const handlePreloaderDone = useCallback(() => setIsReady(true), []);
  const handlePreloaderLeave = useCallback(() => sceneManagerRef.current?.playIntro(), []);
  const handleTilt = useCallback((x: number, y: number) => sceneManagerRef.current?.setDeviceTilt(x, y), []);
  const highlightBenefit = useCallback((index: number) => sceneManagerRef.current?.setBenefitGlow(index), []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Preloader isReady={isReady} onDone={handlePreloaderDone} onLeave={handlePreloaderLeave} />

      <StageBackdrop scene={isHome ? scene : route.type === 'PRODUCT' ? 'flavor' : 'faq'} flavorLines={isHome ? [FLAVORS[activeIndex % FLAVORS.length].line1, FLAVORS[activeIndex % FLAVORS.length].line2] : []} />

      <Atmosphere
        scene={isHome ? scene : 'page'}
        flavorSlug={FLAVORS[activeIndex % FLAVORS.length].id}
        accentToken={FLAVORS[activeIndex % FLAVORS.length].accentToken}
      />

      {webGlAvailable ? (
        <canvas ref={canvasRef} className="webgl-canvas" aria-hidden="true" />
      ) : (
        <FallbackStage activeIndex={activeIndex} />
      )}

      <SiteFrame scene={isHome ? scene : 'page'} />

      <CiaoHeader
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen((open) => !open)}
        onNavigateHome={() => (isHome ? scrollToSection('gamme') : navigate('/'))}
        onOpenBag={() => toggleCart(true)}
      />
      <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} items={menuItems} />
      <FlavorFinder isOpen={isFinderOpen} onClose={() => setIsFinderOpen(false)} onRecommend={handleRecommend} />

      <CartDrawer isOpen={isCartOpen} onClose={() => toggleCart(false)} onNavigate={navigate} />

      {route.type === 'CART' ? (
        <main id="main" className="page">
          <CartPage onNavigate={navigate} />
        </main>
      ) : route.type === 'CHECKOUT' ? (
        <main id="main" className="page">
          <CheckoutPage onNavigate={navigate} />
        </main>
      ) : route.type === 'MIX' ? (
        <main id="main" className="page">
          <PackBuilder onNavigate={navigate} />
        </main>
      ) : route.type === 'HALAL' ? (
        <main id="main" className="page">
          <HalalPage />
        </main>
      ) : route.type === 'STORES' ? (
        <main id="main" className="page">
          <StoreLocator onNavigate={navigate} />
        </main>
      ) : route.type === 'NOT_FOUND' ? (
        <main id="main" className="page">
          <NotFoundPage onNavigate={navigate} />
        </main>
      ) : route.type === 'PRODUCT' ? (
        <main id="main" className="page page--product">
          <ProductDetailPage
            slug={route.slug}
            onNavigate={navigate}
            onRotate={(dx, dy) => sceneManagerRef.current?.rotateProduct(dx, dy)}
            onView={(view) => sceneManagerRef.current?.setProductView(view)}
            onHighlightBenefit={highlightBenefit}
            isWebglAvailable={webGlAvailable}
          />
        </main>
      ) : (
        <main id="main" className="home">
          <HeroCarousel
            activeIndex={activeIndex}
            isActive={scene === 'hero'}
            onSelectFlavor={selectFlavor}
            onPrev={() => stepFlavor(-1)}
            onNext={() => stepFlavor(1)}
            onViewDetails={(slug) => navigate(`/products/${slug}`)}
          />
          <ProfileSection activeIndex={activeIndex} isActive={scene === 'flavor'} onViewDetails={(slug) => navigate(`/products/${slug}`)} />
          <BenefitsSection
            activeChapter={chapter}
            showRail={scene === 'flavor' || scene === 'benefit'}
            onNavigateChapter={(index) => scrollToSection(`benefits-${index + 1}`)}
          />
          <ArgumentSection isActive={scene === 'argument'} />
          <FullGammeSection isActive={scene === 'lineup'} />
          <FaqSection isActive={sectionIndex >= 8} />
          <NewsletterFooter />
        </main>
      )}
      <SiteFooter />
      <PointerFX onTilt={handleTilt} />
      <CookieNotice isReady={isReady} />
    </>
  );
};
