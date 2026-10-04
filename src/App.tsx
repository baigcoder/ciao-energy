import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FLAVORS } from './data/flavors';
import { getProductBySlug } from './data/products';
import { applyHead } from './seo/applyHead';
import type { SceneManager } from './webgl/sceneManager';
import { Preloader } from './components/Preloader';
import { SiteHeader } from './components/SiteHeader';
import { MenuDrawer } from './components/MenuDrawer';
import { SiteFrame } from './components/SiteFrame';
import { SCENE_SEQUENCE } from './webgl/sceneStates';
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
import { ShopPage } from './components/ShopPage';
import { HalalPage } from './components/HalalPage';
import { NotFoundPage } from './components/NotFoundPage';
import { FlavorFinder } from './components/FlavorFinder';
import { StoreLocator } from './components/StoreLocator';
import { PrivacyPage } from './components/PrivacyPage';
import { PointerFX } from './components/PointerFX';
import { CookieNotice } from './components/CookieNotice';
import type { MenuItem } from './components/MenuDrawer';
import { useCart } from './store/cart';
import { useSmoothScroll, prefersReducedMotion } from './hooks/useSmoothScroll';
import { useHomeScroll } from './hooks/useHomeScroll';
import { useCanKeys } from './hooks/useCanKeys';
import { OPENING_MIN_SECONDS, openingShouldPlay } from './webgl/moments/openingConfig';

const MIN_LOADER_MS = 900;
/** A product page only waits for the scene's first frame (its can), not for a cinematic. */
const PRODUCT_LOADER_MS = 250;

/**
 * Which loader a hard load of a route gets. Only the home story has the cinematic opening; a product page
 * holds a short, plain loader until its can is on screen; every other route (shop, bag, checkout, halal,
 * stores, privacy, 404) is plain content and never waits for the 3D scene.
 */
type LoaderMode = 'cinematic' | 'product' | 'none';
const loaderModeFor = (route: AppRoute): LoaderMode => (route.type === 'HOME' ? 'cinematic' : route.type === 'PRODUCT' ? 'product' : 'none');

export type AppRoute =
  | { type: 'HOME' }
  | { type: 'CART' }
  | { type: 'CHECKOUT' }
  | { type: 'SHOP' }
  | { type: 'MIX' }
  | { type: 'HALAL' }
  | { type: 'STORES' }
  | { type: 'PRIVACY' }
  | { type: 'NOT_FOUND' }
  | { type: 'PRODUCT'; slug: string };

const STATIC_ROUTES: Record<string, AppRoute> = {
  '/': { type: 'HOME' },
  '/cart': { type: 'CART' },
  '/checkout': { type: 'CHECKOUT' },
  '/shop': { type: 'SHOP' },
  '/mix': { type: 'MIX' },
  '/halal-zamzam': { type: 'HALAL' },
  '/stores': { type: 'STORES' },
  '/privacy': { type: 'PRIVACY' },
};

function parseCurrentRoute(): AppRoute {
  if (typeof window === 'undefined') return { type: 'HOME' };
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (STATIC_ROUTES[path]) return STATIC_ROUTES[path];
  const product = path.match(/^\/products?\/([^/]+)$/);
  if (product) return { type: 'PRODUCT', slug: product[1] };
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

  // The opening (a can cracking open under the loader) plays once per session, on the home route only.
  const [playOpening] = useState(() => typeof window !== 'undefined' && parseCurrentRoute().type === 'HOME' && !prefersReducedMotion() && openingShouldPlay());
  const [isReady, setIsReady] = useState(false);
  const [route, setRoute] = useState<AppRoute>(parseCurrentRoute);
  const [loaderMode] = useState<LoaderMode>(() => (typeof window === 'undefined' ? 'none' : loaderModeFor(parseCurrentRoute())));
  useEffect(() => {
    if (loaderMode === 'none') document.documentElement.dataset.loader = 'none';
  }, [loaderMode]);
  const [activeIndex, setActiveIndex] = useState<number>(getInitialFlavorIndex);
  const initialFlavorIndexRef = useRef(activeIndex);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [webGlAvailable, setWebGlAvailable] = useState(true);

  const { isOpen: isCartOpen, toggleCart } = useCart();
  const isHome = route.type === 'HOME';
  const { scrollToElement } = useSmoothScroll(isHome && isReady, '.home > .home-section:not(.faq)');
  const { scene, chapter, sectionIndex } = useHomeScroll(isHome, sceneManagerRef);
  useCanKeys(isHome ? 'HOME' : route.type === 'PRODUCT' ? 'PRODUCT' : 'OTHER', sceneManagerRef);

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

  // WebGL scene (client only), loaded as its own chunk so the page's text and UI paint first.
  // Falls back to the static stage when WebGL is unavailable or the chunk fails.
  useEffect(() => {
    const canvas = canvasRef.current;
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!canvas || !gl) {
      setWebGlAvailable(false);
      setIsReady(true);
      return;
    }

    let cancelled = false;
    let readyFrame = 0;
    let teardown: () => void = () => {};
    import('./webgl/sceneManager')
      .then(({ SceneManager }) => {
        if (cancelled) return;
        const sm = new SceneManager(canvas);
        sceneManagerRef.current = sm;
        const isMobile = window.innerWidth < 768;
        const cores = navigator.hardwareConcurrency || 4;
        // Reduced motion keeps the 3D scene but drops to the light tier, with no intro, spin or tilt.
        const quality = prefersReducedMotion() ? 'MEDIUM' : isMobile || cores <= 4 ? 'MEDIUM' : 'HIGH';
        sm.reducedMotion = prefersReducedMotion();
        sm.setQuality(quality);
        document.documentElement.dataset.quality = quality;
        sm.onQualityChange = (level) => {
          document.documentElement.dataset.quality = level;
        };
        const initial = parseCurrentRoute();
        sm.setRoute(sceneRoute(initial), initial.type === 'PRODUCT' ? initial.slug : undefined);
        sm.setInitialFlavor(initialFlavorIndexRef.current);
        if (initial.type === 'HOME') sm.armIntro(playOpening);
        const unsubscribe = sm.carousel.onChanged(({ index }) => setActiveIndex(index));
        readyFrame = requestAnimationFrame(() => {
          readyFrame = requestAnimationFrame(() => setIsReady(true));
        });
        teardown = () => {
          unsubscribe();
          if (sceneManagerRef.current === sm) sceneManagerRef.current = null;
          sm.dispose();
        };
      })
      .catch(() => {
        if (cancelled) return;
        setWebGlAvailable(false);
        setIsReady(true);
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(readyFrame);
      teardown();
    };
  }, [playOpening]);

  // Flavor drives the colour tokens ([data-flavor]) and a shareable hash.
  useEffect(() => {
    const flavor = FLAVORS[activeIndex % FLAVORS.length];
    const productFlavor = route.type === 'PRODUCT' ? getProductBySlug(route.slug)?.slug : undefined;
    document.documentElement.dataset.flavor = productFlavor ?? flavor.id;
    if (isHome && !/#(faq|newsletter|benefits)/i.test(window.location.hash)) {
      window.history.replaceState(null, '', `#flavor=${flavor.id}`);
    }
  }, [activeIndex, route, isHome]);

  // Title, description, canonical, Open Graph and JSON-LD per route (src/seo/meta.ts).
  useEffect(() => {
    applyHead(route);
  }, [route]);

  // Product page scroll: the can moves away with the hero on narrow screens, and lifts clear of the footer on wide ones.
  useEffect(() => {
    if (route.type !== 'PRODUCT') return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const sm = sceneManagerRef.current;
        sm?.setProductScroll(window.scrollY / window.innerHeight);
        // Last ~0.8 screens of the page: the pinned can (and its DOM controls) lift away from the footer.
        const remaining = (document.documentElement.scrollHeight - window.scrollY - window.innerHeight) / window.innerHeight;
        const exit = Math.min(1, Math.max(0, 1 - remaining / 0.8));
        sm?.setProductExit(exit);
        document.documentElement.style.setProperty('--pdp-exit', exit.toFixed(3));
        document.documentElement.toggleAttribute('data-pdp-end', exit > 0.35);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      document.documentElement.style.removeProperty('--pdp-exit');
      document.documentElement.removeAttribute('data-pdp-end');
    };
  }, [route]);

  // Narrow product pages: the can is framed inside the measured DOM stage, whatever its height is.
  useEffect(() => {
    if (route.type !== 'PRODUCT') return;
    let frame = 0;
    let observer: ResizeObserver | undefined;
    const measure = () => {
      const stage = document.querySelector<HTMLElement>('.pdp-stage');
      const sm = sceneManagerRef.current;
      if (!stage || !sm) return;
      const rect = stage.getBoundingClientRect();
      sm.setProductStage(window.innerWidth < 1024 ? { top: rect.top + window.scrollY, height: rect.height } : null);
    };
    // The stage mounts with the page and the scene may still be loading: retry for a few frames.
    let tries = 0;
    const attach = () => {
      const stage = document.querySelector<HTMLElement>('.pdp-stage');
      if (stage && sceneManagerRef.current) {
        measure();
        observer = new ResizeObserver(measure);
        observer.observe(stage);
        return;
      }
      if (tries++ < 120) frame = requestAnimationFrame(attach);
    };
    attach();
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      sceneManagerRef.current?.setProductStage(null);
    };
  }, [route, isReady]);

  // Keep the focused hero can between the header logo and the flavor title at every viewport size.
  useEffect(() => {
    if (!isHome) return;
    const title = document.querySelector<HTMLElement>('.hero__title-wrap');
    if (!title) return;
    const update = () => {
      const top = title.getBoundingClientRect().top + window.scrollY;
      const logo = document.querySelector<HTMLElement>('.site-logo');
      sceneManagerRef.current?.setHeroSafeBottom(top, logo ? logo.getBoundingClientRect().bottom : 0);
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

  // The roar: once per visit, the first scroll away from the top.
  useEffect(() => {
    if (!isHome || !isReady) return;
    const onScroll = () => {
      if (window.scrollY < 24) return;
      window.removeEventListener('scroll', onScroll);
      sceneManagerRef.current?.roar();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
    { key: 'range', href: '/shop', onSelect: () => navigate('/shop') },
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
      {loaderMode !== 'none' && (
        <Preloader
          isReady={isReady}
          onDone={handlePreloaderDone}
          onLeave={handlePreloaderLeave}
          minDurationMs={loaderMode === 'product' ? PRODUCT_LOADER_MS : playOpening && webGlAvailable ? OPENING_MIN_SECONDS * 1000 : MIN_LOADER_MS}
          showStage={loaderMode === 'cinematic' && playOpening && webGlAvailable}
        />
      )}

      {!webGlAvailable && (
        <>
          <StageBackdrop scene={isHome ? scene : route.type === 'PRODUCT' ? 'flavor' : 'faq'} flavorLines={isHome ? [FLAVORS[activeIndex % FLAVORS.length].line1, FLAVORS[activeIndex % FLAVORS.length].line2] : []} />
          <Atmosphere
            scene={isHome ? scene : 'page'}
            flavorSlug={FLAVORS[activeIndex % FLAVORS.length].id}
            accentToken={FLAVORS[activeIndex % FLAVORS.length].accentToken}
          />
        </>
      )}

      {webGlAvailable ? (
        <canvas
          ref={canvasRef}
          className="webgl-canvas"
          role="img"
          aria-label="Grizzly Energy cans in a cold mountain night: Blue Raspberry, Mango Fuego, Watermelon, Strawberry Kiwi, Peach and Blackout Berry. Everything shown here is also written on the page."
        />
      ) : (
        <FallbackStage activeIndex={activeIndex} />
      )}

      <SiteFrame scene={isHome ? scene : 'page'} chapter={isHome ? sectionIndex : undefined} chapters={SCENE_SEQUENCE.length} />

      <SiteHeader
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
      ) : route.type === 'SHOP' ? (
        <main id="main" className="page">
          <ShopPage onNavigate={navigate} />
        </main>
      ) : route.type === 'MIX' ? (
        <main id="main" className="page">
          <PackBuilder onNavigate={navigate} />
        </main>
      ) : route.type === 'HALAL' ? (
        <main id="main" className="page">
          <HalalPage />
        </main>
      ) : route.type === 'PRIVACY' ? (
        <main id="main" className="page">
          <PrivacyPage />
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
          <FullGammeSection isActive={scene === 'lineup'} onShop={() => navigate('/shop')} />
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
