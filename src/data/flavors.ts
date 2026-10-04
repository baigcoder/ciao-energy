import { Flavor } from '../types';
import { GRIZZLY_FLAVORS } from './brand';

/** Flavor list for the scene and the home page, derived from grizzly.json. */
export const FLAVORS: Flavor[] = GRIZZLY_FLAVORS.map((flavor, index) => ({
  id: flavor.slug,
  index,
  name: flavor.name,
  line1: flavor.lines[0].toUpperCase(),
  line2: (flavor.lines[1] ?? '').toUpperCase(),
  description: flavor.description,
  theme: { primary: flavor.accentDeep, secondary: flavor.accent, accent: flavor.accent },
  accentToken: flavor.accentToken,
  textureUrl: `/textures/grizzly/${flavor.slug}.webp`,
  surfaceUrl: `/textures/grizzly/${flavor.slug}-surface.png`,
  hasFrontArt: Boolean(flavor.front),
}));
