import * as THREE from 'three';
import { CAN, LID_Y, TAB_PIVOT, getCanGeometry } from './canGeometry';

/**
 * Grizzly can asset and material pipeline.
 *
 * 1. Geometry is modelled in code (canGeometry.ts): shell, neck/seam/lid, tab, domed base.
 * 2. Body material: satin black lacquer over metal with a clear coat; the label surface
 *    map (G roughness, B metalness) turns the wordmark into brushed silver, and the
 *    normal map embosses it. Condensation and the benefit spotlight are shader extensions.
 * 3. Ends: machined aluminium.
 * Label textures arrive asynchronously (labelTextures.ts); until then a neutral dark
 * placeholder is shown, never another brand's artwork.
 */

/** Solid-colour 4×4 placeholder used until the real label art has been transcoded. */
export function createSolidTexture(r: number, g: number, b: number, srgb: boolean): THREE.DataTexture {
  const data = new Uint8Array(4 * 4 * 4);
  for (let i = 0; i < 16; i += 1) data.set([r, g, b, 255], i * 4);
  const texture = new THREE.DataTexture(data, 4, 4, THREE.RGBAFormat);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/** Near-black label used before the artwork loads. */
export const createPlaceholderLabel = () => createSolidTexture(10, 11, 14, true);

/** Flat normal (128,128,255) used until the emboss map loads. */
export const createFlatNormalTexture = (): THREE.Texture => createSolidTexture(128, 128, 255, false);

/** Satin-black surface (G roughness, B metalness) used until the real map loads. */
export const createNeutralSurfaceTexture = (): THREE.Texture => createSolidTexture(255, 110, 90, false);

/**
 * Condensation: one tileable 512² map shared by every can. RG = normal XY of
 * the droplets, B = droplet mask (glossier, slightly brighter: cheap refraction),
 * A unused. Round beads plus a few running drops with trails.
 */
let cachedDropTexture: THREE.Texture | null = null;
/**
 * Condensation shared by every can: bead strength, and a clock for the drops that gather and run
 * down the label (real time; frozen for reduced motion by not advancing uDropTime).
 */
export const condensation = { uDropStrength: { value: 0.6 }, uDropTime: { value: 0 } };

function getDropTexture(): THREE.Texture {
  if (cachedDropTexture) return cachedDropTexture;
  const size = 512;
  const height = document.createElement('canvas');
  height.width = size;
  height.height = size;
  const h = height.getContext('2d');
  if (h) {
    h.fillStyle = '#000';
    h.fillRect(0, 0, size, size);
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const bead = (x: number, y: number, r: number) => {
      // draw wrapped so the map tiles seamlessly
      for (const ox of [-size, 0, size]) {
        for (const oy of [-size, 0, size]) {
          const g = h.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
          g.addColorStop(0, 'rgba(255,255,255,1)');
          g.addColorStop(0.6, 'rgba(200,200,200,0.85)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          h.fillStyle = g;
          h.beginPath();
          h.arc(x + ox, y + oy, r, 0, Math.PI * 2);
          h.fill();
        }
      }
    };
    for (let i = 0; i < 900; i++) bead(rand() * size, rand() * size, 0.8 + rand() * 2.2);
    for (let i = 0; i < 140; i++) bead(rand() * size, rand() * size, 3 + rand() * 4.5);
    // running drops: a bead with a thin tapering trail above it
    for (let i = 0; i < 7; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const length = 40 + rand() * 90;
      for (let t = 0; t < length; t += 1.5) bead(x + Math.sin(t * 0.05) * 1.5, y - t, 1.2 + (1 - t / length) * 1.6);
      bead(x, y, 5.5);
    }
  }
  const src = h?.getImageData(0, 0, size, size).data;
  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const o = out.getContext('2d');
  if (o && src) {
    const img = o.createImageData(size, size);
    const at = (x: number, y: number) => src[((((y + size) % size) * size) + ((x + size) % size)) * 4] / 255;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (at(x + 1, y) - at(x - 1, y)) * 3;
        const dy = (at(x, y + 1) - at(x, y - 1)) * 3;
        const k = (y * size + x) * 4;
        img.data[k] = Math.round((0.5 - dx * 0.5) * 255);
        img.data[k + 1] = Math.round((0.5 + dy * 0.5) * 255);
        img.data[k + 2] = Math.round(at(x, y) * 255);
        img.data[k + 3] = 255;
      }
    }
    o.putImageData(img, 0, 0);
  }
  const texture = new THREE.CanvasTexture(out);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  cachedDropTexture = texture;
  return texture;
}

// Shared brushed-aluminium grain (horizontal streaks), generated once. One texture for every can.
let cachedBrushTexture: THREE.Texture | null = null;

function getBrushTexture(): THREE.Texture {
  if (cachedBrushTexture) return cachedBrushTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    let seed = 11;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    ctx.fillStyle = 'rgb(128,128,128)';
    ctx.fillRect(0, 0, size, size);
    // Long, thin streaks that wrap horizontally so the grain tiles around the can.
    for (let i = 0; i < 1400; i += 1) {
      const y = rand() * size;
      const x = rand() * size;
      const length = 40 + rand() * 180;
      const tone = 70 + rand() * 120;
      ctx.fillStyle = `rgba(${tone},${tone},${tone},${0.1 + rand() * 0.25})`;
      for (const ox of [-size, 0, size]) ctx.fillRect(x + ox, y, length, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  cachedBrushTexture = tex;
  return tex;
}

/**
 * Per-can shader controls, mutated from the render loop (never re-created).
 * - focus: 1 = lit hero can, 0 = background can that falls almost to black.
 * - glowRect: UV rect (u0, v0, u1, v1) of the label block that glows during benefits.
 * - glowStrength: emissive gain of that block (0 = off).
 * - labelDim: extra darkening of the printed label (benefit chapters turn the can dark).
 */
export interface CanSurfaceUniforms {
  uFocus: { value: number };
  uLabelDim: { value: number };
  uGlowRect: { value: THREE.Vector4 };
  uGlowColor: { value: THREE.Color };
  uGlowStrength: { value: number };
  uBrushMap: { value: THREE.Texture };
  /** Thin fresnel rim in the can's own flavor accent. */
  uRimColor: { value: THREE.Color };
  uRimStrength: { value: number };
  uDropMap: { value: THREE.Texture };
  uDropStrength: { value: number };
  uDropTime: { value: number };
  /** 0..1: the label dissolves away in an organic noise pattern (the push into the can). */
  uDissolve: { value: number };
}

/**
 * Brushed aluminium + printed ink, derived from one label texture:
 * - near-white artwork (the logo) is bare brushed metal: metalness 1, silver albedo;
 * - coloured artwork is lacquered ink on metal: deep, slightly desaturated, still metallic;
 * - the shared grain map modulates roughness so the brushing reads in highlights.
 */
function applyCanSurfaceShader(material: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial) {
  const uniforms: CanSurfaceUniforms = {
    uFocus: { value: 1 },
    uLabelDim: { value: 0 },
    uGlowRect: { value: new THREE.Vector4(0, 0, 0, 0) },
    uGlowColor: { value: new THREE.Color(1, 1, 1) },
    uGlowStrength: { value: 0 },
    uBrushMap: { value: getBrushTexture() },
    uRimColor: { value: new THREE.Color(1, 1, 1) },
    uRimStrength: { value: 0 },
    uDropMap: { value: getDropTexture() },
    uDropStrength: condensation.uDropStrength,
    uDropTime: condensation.uDropTime,
    uDissolve: { value: 0 },
  };
  material.userData.surface = uniforms;
  material.customProgramCacheKey = () => 'gz-can-surface';
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uFocus;
        uniform float uLabelDim;
        uniform vec4 uGlowRect;
        uniform vec3 uGlowColor;
        uniform float uGlowStrength;
        uniform sampler2D uBrushMap;
        uniform vec3 uRimColor;
        uniform float uRimStrength;
        uniform sampler2D uDropMap;
        uniform float uDropStrength;
        uniform float uDropTime;
        uniform float uDissolve;
        float gzDissolveN = 1.0;
        float gzH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float gzN(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(gzH(i), gzH(i + vec2(1.0, 0.0)), f.x), mix(gzH(i + vec2(0.0, 1.0)), gzH(i + vec2(1.0, 1.0)), f.x), f.y); }
        vec3 gzDrop = vec3(0.5, 0.5, 0.0);
        float gzDropK = 0.0;
        float gzMetal = 0.0;
        float gzBrush = 0.5;
        float gzRect(vec2 p, vec4 r, float soft) {
          vec2 lo = smoothstep(r.xy - soft, r.xy + soft, p);
          vec2 hi = 1.0 - smoothstep(r.zw - soft, r.zw + soft, p);
          return lo.x * lo.y * hi.x * hi.y;
        }`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        #ifdef USE_MAP
          if (uDissolve > 0.001) {
            vec2 dp = vMapUv * vec2(14.0, 10.0);
            gzDissolveN = 0.55 * gzN(dp) + 0.3 * gzN(dp * 2.3 + 5.0) + 0.15 * gzN(dp * 5.1 + 9.0);
            if (gzDissolveN < uDissolve * 1.2 - 0.1) discard;
          }
          vec3 gzInk = diffuseColor.rgb;
          #ifdef USE_METALNESSMAP
            gzMetal = smoothstep(0.6, 0.95, texture2D(metalnessMap, vMapUv).b);
          #else
            gzMetal = smoothstep(0.42, 0.78, min(gzInk.r, min(gzInk.g, gzInk.b)));
          #endif
          gzBrush = texture2D(uBrushMap, vMapUv * vec2(3.0, 2.4)).r;
          gzDrop = texture2D(uDropMap, vMapUv * vec2(5.0, 4.0)).rgb;
          {
            // Running drops: in a few of 28 lanes round the can a bead slides down, wobbling, and
            // leaves a thinning wet trail (smoother, clearer) behind it. Then the lane rests.
            float gzLanes = 28.0;
            float gzLx = vMapUv.x * gzLanes;
            float gzLane = floor(gzLx);
            float gzSeed = gzH(vec2(gzLane, 3.7));
            float gzSpeed = 0.035 + 0.05 * gzSeed;
            float gzCycle = uDropTime * gzSpeed + gzSeed * 9.0;
            float gzRunOn = step(0.62, gzH(vec2(gzLane, floor(gzCycle))));
            float gzHead = 1.05 - fract(gzCycle) * 1.25;       // v of the bead, top to bottom
            float gzWobble = sin(vMapUv.y * 38.0 + gzSeed * 20.0) * 0.08 + sin(vMapUv.y * 91.0 + gzSeed * 5.0) * 0.03;
            float gzDx = fract(gzLx) - 0.5 - gzWobble;
            float gzD = vMapUv.y - gzHead;                       // > 0: above the bead (the trail)
            float gzTrail = smoothstep(0.32, 0.0, gzD) * step(0.0, gzD) * smoothstep(0.07, 0.0, abs(gzDx) * (1.2 + gzD * 3.0));
            float gzBead = exp(-(gzDx * gzDx * 180.0 + gzD * gzD * 9000.0));
            float gzRun = gzRunOn * max(gzTrail * 0.85, gzBead);
            // the running water clears the beads it passes through, and bends the normal sideways
            gzDrop.b = max(gzDrop.b * (1.0 - gzTrail * gzRunOn), gzRun);
            gzDrop.rg = mix(gzDrop.rg, vec2(0.5 - gzDx * 3.0, 0.5 + gzD * 2.0 * gzBead), gzRun);
          }
          // small, dim background cans get fewer beads: at that size they only read as grain
          gzDropK = uDropStrength * mix(0.15, 1.0, uFocus * uFocus);
          // droplets lift the colour a touch (light bending through water)
          diffuseColor.rgb += diffuseColor.rgb * gzDrop.b * 0.18 * gzDropK;
          float gzLum = dot(gzInk, vec3(0.2126, 0.7152, 0.0722));
          #ifdef USE_METALNESSMAP
            vec3 deepInk = gzInk; // printed artwork keeps its own colour
          #else
            vec3 deepInk = mix(gzInk, vec3(gzLum), 0.18) * 0.78;
          #endif
          vec3 silver = vec3(0.86, 0.87, 0.9) * (0.88 + 0.24 * gzBrush);
          diffuseColor.rgb = mix(deepInk, max(deepInk, silver * 0.92), gzMetal);
          // Benefit spotlight: the rest of the label drops to ~25%, the active block stays at full brightness.
          float gzSpot = gzRect(vMapUv, uGlowRect, 0.008) * step(0.001, uGlowStrength);
          diffuseColor.rgb *= mix(1.0, 0.1, uLabelDim * (1.0 - gzSpot)) * (1.0 + 0.7 * uLabelDim * gzSpot);
        #endif
        // out-of-focus cans fall to near-black silhouettes; their chrome ends and edges stay lit
        diffuseColor.rgb *= mix(0.07, 1.0, uFocus * uFocus);
        #ifdef USE_MAP
          // studio falloff down the body: lit under the lid, a touch darker at the base (packshot light)
          diffuseColor.rgb *= mix(0.8, 1.04, smoothstep(0.03, 0.97, vMapUv.y));
        #endif`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#ifdef USE_ROUGHNESSMAP
          float roughnessFactor = roughness * texture2D(roughnessMap, vRoughnessMapUv).g * (0.85 + 0.3 * gzBrush);
          roughnessFactor = mix(roughnessFactor, 0.06, gzDrop.b * gzDropK);
        #else
          float roughnessFactor = roughness * mix(0.46, 0.2, gzMetal) * (0.82 + 0.36 * gzBrush);
        #endif`
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#ifdef USE_METALNESSMAP
          float metalnessFactor = metalness * texture2D(metalnessMap, vMetalnessMapUv).b;
        #else
          float metalnessFactor = metalness * mix(0.72, 1.0, gzMetal);
        #endif`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        #ifdef USE_NORMALMAP_TANGENTSPACE
          vec2 dropXY = (gzDrop.rg * 2.0 - 1.0) * gzDropK;
          normal = normalize(normal + tbn[0] * dropXY.x + tbn[1] * dropXY.y);
        #endif`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          float rimFacing = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
          totalEmissiveRadiance += uRimColor * uRimStrength * pow(rimFacing, 4.0);
        }
        if (uDissolve > 0.001) {
          float band = 1.0 - smoothstep(0.0, 0.05, gzDissolveN - (uDissolve * 1.2 - 0.1));
          totalEmissiveRadiance += uRimColor * band * 2.2;
        }
        #ifdef USE_MAP
          if (uGlowStrength > 0.001) {
            vec3 gzTexel = texture2D(map, vMapUv).rgb;
            float gzText = max(gzTexel.r, max(gzTexel.g, gzTexel.b));
            float core = gzRect(vMapUv, uGlowRect, 0.006);
            float halo = gzRect(vMapUv, uGlowRect + vec4(-0.03, -0.04, 0.03, 0.04), 0.04);
            totalEmissiveRadiance += uGlowColor * uGlowStrength * (core * 4.5 * gzText * gzText * gzText + halo * 0.07);
          }
        #endif`
      );
  };
}

/**
 * Creates physical materials for can components: brushed-aluminium label shell and
 * machined aluminium ends. Low-power devices keep the same look on MeshStandardMaterial.
 */
export function createCanMaterials(
  texture: THREE.Texture,
  surface: THREE.Texture | null = null,
  isLowPower: boolean = false,
  normal: THREE.Texture | null = null
): { bodyMat: THREE.Material; aluminumMat: THREE.Material } {
  // Satin black body, brushed silver only where the surface map says so;
  // the normal map embosses the wordmark (condensation is added in the shader).
  const surfaceMaps = {
    ...(surface ? { metalnessMap: surface, roughnessMap: surface } : {}),
    ...(normal ? { normalMap: normal, normalScale: new THREE.Vector2(0.8, 0.8) } : {}),
  };
  const bodyMat = isLowPower
    ? new THREE.MeshStandardMaterial({
        map: texture,
        ...surfaceMaps,
        metalness: 1,
        roughness: 1,
        envMapIntensity: 1,
      })
    : new THREE.MeshPhysicalMaterial({
        map: texture,
        ...surfaceMaps,
        metalness: 1,
        roughness: 1,
        anisotropy: 0.3,
        anisotropyRotation: 0,
        // printed cans are varnished: a crisp clear coat gives the long vertical studio highlight
        clearcoat: 0.55,
        clearcoatRoughness: 0.32, // a broad, soft varnish sheen rather than a hard stripe
        envMapIntensity: 1,
      });
  applyCanSurfaceShader(bodyMat);

  const aluminumMat = isLowPower
    ? new THREE.MeshStandardMaterial({
        color: 0xd9dbe0,
        metalness: 1,
        roughness: 0.24,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0xb4b8c1,
        metalness: 1,
        roughness: 0.34, // machined lid: crisp rings, a hotspot that never clips to white
        anisotropy: 0.35,
        envMapIntensity: 0.85,
      });
  return { bodyMat, aluminumMat };
}

const baseMaterials = new WeakMap<THREE.Material, THREE.Material>();
function getBaseMaterial(aluminum: THREE.Material): THREE.Material {
  let base = baseMaterials.get(aluminum);
  if (!base) {
    base = aluminum.clone();
    (base as THREE.MeshStandardMaterial).roughness = 0.42;
    (base as THREE.MeshStandardMaterial).color.setHex(0xc9ccd2);
    baseMaterials.set(aluminum, base);
  }
  return base;
}

/** Dims the aluminium ends together with the label so out-of-focus cans go dark. */
export function setCanFocus(can: THREE.Object3D, focus: number) {
  const boost = (can.userData.rimBoost as number | undefined) ?? 0;
  if (can.userData.focus === focus && can.userData.appliedBoost === boost) return;
  can.userData.focus = focus;
  can.userData.appliedBoost = boost;
  can.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const material = mesh.material as THREE.MeshStandardMaterial;
    const surface = material.userData.surface as CanSurfaceUniforms | undefined;
    if (surface) {
      surface.uFocus.value = focus;
      material.envMapIntensity = 0.45 + 0.55 * focus;
      // a faint coloured rim separates side cans from the night; the featured can gets almost none (no outline glow)
      surface.uRimStrength.value = 0.45 - 0.37 * focus + boost;
      const physical = material as THREE.MeshPhysicalMaterial;
      if (physical.isMeshPhysicalMaterial) physical.clearcoat = Math.max(0.001, 0.55 * focus); // never 0: avoids a shader recompile
    } else if (material.color) {
      // machined aluminium: dim it with the label, relative to its authored colour and reflectance
      const base = (material.userData.base ??= { color: material.color.clone(), env: material.envMapIntensity }) as { color: THREE.Color; env: number };
      // the machined ends stay bright chrome even on dark side cans (only their reflections dim)
      material.color.copy(base.color).multiplyScalar(0.6 + 0.4 * focus);
      material.envMapIntensity = base.env * (0.3 + 0.7 * focus);
    }
  });
}

/** Scales the reflectance of the can's metal ends (the opening holds the lid in a dark, cold light). */
export function setCanLidExposure(can: THREE.Object3D, exposure: number) {
  ['Top', 'Tab'].forEach((name) => {
    const material = (can.getObjectByName(name) as THREE.Mesh | undefined)?.material as THREE.MeshStandardMaterial | undefined;
    if (!material) return;
    const base = (material.userData.base ??= { color: material.color.clone(), env: material.envMapIntensity }) as { color: THREE.Color; env: number };
    material.envMapIntensity = base.env * exposure;
  });
}

/** Tints the can's rim light with its flavor accent (called once per can). */
export function setCanAccent(can: THREE.Object3D, hex: string) {
  const surface = getCanSurface(can);
  surface?.uRimColor.value.set(hex);
}

/** Returns the label-shell shader controls of a can (glow, label dimming). */
export function getCanSurface(can: THREE.Object3D): CanSurfaceUniforms | undefined {
  const shell = can.getObjectByName('Shell') as THREE.Mesh | undefined;
  return (shell?.material as THREE.Material | undefined)?.userData.surface as CanSurfaceUniforms | undefined;
}

export interface CanMaterials {
  bodyMat: THREE.Material;
  aluminumMat: THREE.Material;
}

/** Handles used by the opening moment and the roar: tab pivot, drinking hole. */
export interface CanParts {
  tabPivot: THREE.Group;
  opening: THREE.Mesh;
}

/** Builds one can from the shared geometry set. Child names: Shell, Top, Bottom, TabPivot > Tab, Opening. */
export function createCanMesh(
  texture: THREE.Texture,
  surface: THREE.Texture | null = null,
  isLowPower: boolean = false,
  normal: THREE.Texture | null = null
): THREE.Group {
  const materials = createCanMaterials(texture, surface, isLowPower, normal);
  const geometry = getCanGeometry();
  const group = new THREE.Group();

  const shell = new THREE.Mesh(geometry.shell, materials.bodyMat);
  shell.name = 'Shell';
  const top = new THREE.Mesh(geometry.top, materials.aluminumMat);
  top.name = 'Top';
  const bottom = new THREE.Mesh(geometry.bottom, getBaseMaterial(materials.aluminumMat));
  bottom.name = 'Bottom';

  const tabPivot = new THREE.Group();
  tabPivot.name = 'TabPivot';
  tabPivot.position.copy(TAB_PIVOT);
  const tab = new THREE.Mesh(geometry.tab, materials.aluminumMat);
  tab.name = 'Tab';
  tab.position.set(0, 0, -0.02);
  tabPivot.add(tab);

  const opening = new THREE.Mesh(geometry.opening, new THREE.MeshBasicMaterial({ color: 0x020203 }));
  opening.name = 'Opening';
  opening.position.set(0, LID_Y + 0.004, -0.2);
  opening.visible = false;

  group.add(shell, top, bottom, tabPivot, opening);
  group.userData.parts = { tabPivot, opening } satisfies CanParts;
  return group;
}

export const getCanParts = (can: THREE.Object3D): CanParts | undefined => can.userData.parts as CanParts | undefined;

/** Frees every material owned by a can (geometry is shared and disposed with the scene). */
export function disposeCanMaterials(can: THREE.Object3D) {
  can.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    (mesh.material as THREE.Material).dispose();
  });
}

export { CAN };
