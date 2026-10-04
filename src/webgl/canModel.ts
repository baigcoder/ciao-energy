import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FLAVORS } from '../data/flavors';

/**
 * GRIZZLY ENERGY — 3D Can Asset & Material Pipeline
 *
 * Implements:
 * 1. Text-free placeholder label for the frames before the label file loads.
 * 2. Official GLB loader for can.glb with geometry caching and material cloning.
 * 3. Watertight, continuous procedural can geometry fallback with identical UV space.
 * 4. PBR physical materials calibrated to printed aluminum standards.
 * 5. Official base.glb loader for ceiling fixture and floor pedestal.
 */

// Shared GLTF loader and cache
const gltfLoader = new GLTFLoader();
let cachedCanScene: THREE.Group | null = null;
let cachedBaseScene: THREE.Group | null = null;
let canLoadPromise: Promise<THREE.Group> | null = null;
let baseLoadPromise: Promise<THREE.Group> | null = null;

/**
 * Preloads the official can.glb asset.
 */
export function preloadCanModel(): Promise<THREE.Group> {
  if (cachedCanScene) return Promise.resolve(cachedCanScene);
  if (canLoadPromise) return canLoadPromise;

  canLoadPromise = new Promise((resolve, reject) => {
    gltfLoader.load(
      '/models/can.glb',
      (gltf) => {
        cachedCanScene = gltf.scene;
        resolve(cachedCanScene);
      },
      undefined,
      (err) => {
        // Fallback to null on failure so procedural geometry remains active
        console.warn('Can GLB load deferred to procedural fallback:', err);
        reject(err);
      }
    );
  });

  return canLoadPromise;
}

/**
 * Preloads the official base.glb asset (pedestal & ceiling disc).
 */
export function preloadBaseModel(): Promise<THREE.Group> {
  if (cachedBaseScene) return Promise.resolve(cachedBaseScene);
  if (baseLoadPromise) return baseLoadPromise;

  baseLoadPromise = new Promise((resolve, reject) => {
    gltfLoader.load(
      '/models/base.glb',
      (gltf) => {
        cachedBaseScene = gltf.scene;
        resolve(cachedBaseScene);
      },
      undefined,
      (err) => {
        console.warn('Base GLB load deferred to procedural fallback:', err);
        reject(err);
      }
    );
  });

  return baseLoadPromise;
}

/**
 * Placeholder label for the first frames, until the flavor's label file arrives
 * (the material swaps the image in place). Satin black with a soft band of the
 * flavor colour on the front panel: no text, so nothing unconfirmed is printed.
 */
export function generateProceduralLabelTexture(flavorIndex: number): THREE.CanvasTexture {
  const flavor = FLAVORS[flavorIndex % FLAVORS.length];
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, flavor.theme.primary);
    gradient.addColorStop(0.5, flavor.theme.secondary);
    gradient.addColorStop(1, flavor.theme.primary);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = flavor.theme.primary;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** 1×1 flat normal (128,128,255) used until the emboss map loads. */
export function createFlatNormalTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgb(128,128,255)';
    ctx.fillRect(0, 0, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/** 1×1 satin-black surface (G roughness, B metalness) used until the real map loads. */
export function createNeutralSurfaceTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgb(255,110,90)';
    ctx.fillRect(0, 0, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * Condensation: one tileable 512² map shared by every can. RG = normal XY of
 * the droplets, B = droplet mask (glossier, slightly brighter: cheap refraction),
 * A unused. Round beads plus a few running drops with trails.
 */
let cachedDropTexture: THREE.Texture | null = null;
export const condensation = { uDropStrength: { value: 0.6 } };

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

// Shared brushed-aluminium grain (horizontal streaks). One texture for every can.
let cachedBrushTexture: THREE.Texture | null = null;

function getBrushTexture(): THREE.Texture {
  if (cachedBrushTexture) return cachedBrushTexture;
  const tex = new THREE.TextureLoader().load('/textures/can-metallic-2.avif');
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
  };
  material.userData.surface = uniforms;
  material.customProgramCacheKey = () => 'ciao-can-surface';
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
        vec3 ciaoDrop = vec3(0.5, 0.5, 0.0);
        float ciaoDropK = 0.0;
        float ciaoMetal = 0.0;
        float ciaoBrush = 0.5;
        float ciaoRect(vec2 p, vec4 r, float soft) {
          vec2 lo = smoothstep(r.xy - soft, r.xy + soft, p);
          vec2 hi = 1.0 - smoothstep(r.zw - soft, r.zw + soft, p);
          return lo.x * lo.y * hi.x * hi.y;
        }`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        #ifdef USE_MAP
          vec3 ciaoInk = diffuseColor.rgb;
          #ifdef USE_METALNESSMAP
            ciaoMetal = smoothstep(0.6, 0.95, texture2D(metalnessMap, vMapUv).b);
          #else
            ciaoMetal = smoothstep(0.42, 0.78, min(ciaoInk.r, min(ciaoInk.g, ciaoInk.b)));
          #endif
          ciaoBrush = texture2D(uBrushMap, vMapUv * vec2(3.0, 2.4)).r;
          ciaoDrop = texture2D(uDropMap, vMapUv * vec2(5.0, 4.0)).rgb;
          // small, dim background cans get fewer beads: at that size they only read as grain
          ciaoDropK = uDropStrength * mix(0.15, 1.0, uFocus * uFocus);
          // droplets lift the colour a touch (light bending through water)
          diffuseColor.rgb += diffuseColor.rgb * ciaoDrop.b * 0.18 * ciaoDropK;
          float ciaoLum = dot(ciaoInk, vec3(0.2126, 0.7152, 0.0722));
          #ifdef USE_METALNESSMAP
            vec3 deepInk = ciaoInk; // printed artwork keeps its own colour
          #else
            vec3 deepInk = mix(ciaoInk, vec3(ciaoLum), 0.18) * 0.78;
          #endif
          vec3 silver = vec3(0.86, 0.87, 0.9) * (0.88 + 0.24 * ciaoBrush);
          diffuseColor.rgb = mix(deepInk, max(deepInk, silver * 0.92), ciaoMetal);
          // Benefit spotlight: the rest of the label drops to ~25%, the active block stays at full brightness.
          float ciaoSpot = ciaoRect(vMapUv, uGlowRect, 0.008) * step(0.001, uGlowStrength);
          diffuseColor.rgb *= mix(1.0, 0.25, uLabelDim * (1.0 - ciaoSpot));
        #endif
        diffuseColor.rgb *= mix(0.04, 1.0, uFocus);`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#ifdef USE_ROUGHNESSMAP
          float roughnessFactor = roughness * texture2D(roughnessMap, vRoughnessMapUv).g * (0.85 + 0.3 * ciaoBrush);
          roughnessFactor = mix(roughnessFactor, 0.06, ciaoDrop.b * ciaoDropK);
        #else
          float roughnessFactor = roughness * mix(0.46, 0.2, ciaoMetal) * (0.82 + 0.36 * ciaoBrush);
        #endif`
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#ifdef USE_METALNESSMAP
          float metalnessFactor = metalness * texture2D(metalnessMap, vMetalnessMapUv).b;
        #else
          float metalnessFactor = metalness * mix(0.72, 1.0, ciaoMetal);
        #endif`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        #ifdef USE_NORMALMAP_TANGENTSPACE
          vec2 dropXY = (ciaoDrop.rg * 2.0 - 1.0) * ciaoDropK;
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
        #ifdef USE_MAP
          if (uGlowStrength > 0.001) {
            vec3 ciaoTexel = texture2D(map, vMapUv).rgb;
            float ciaoText = max(ciaoTexel.r, max(ciaoTexel.g, ciaoTexel.b));
            float core = ciaoRect(vMapUv, uGlowRect, 0.006);
            float halo = ciaoRect(vMapUv, uGlowRect + vec4(-0.03, -0.04, 0.03, 0.04), 0.04);
            totalEmissiveRadiance += uGlowColor * uGlowStrength * (core * 3.2 * ciaoText * ciaoText * ciaoText + halo * 0.04);
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
        clearcoat: 0.22,
        clearcoatRoughness: 0.3,
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
        color: 0xd9dbe0,
        metalness: 1,
        roughness: 0.42, // softer lid hotspot
        anisotropy: 0.2,
      });
  // The lid and domed base are single surfaces whose faces point inward in the
  // model; render both sides so the base reads as a dome, not a hollow ring.
  aluminumMat.side = THREE.DoubleSide;

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
  if (can.userData.focus === focus) return;
  can.userData.focus = focus;
  can.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const material = mesh.material as THREE.MeshStandardMaterial;
    const surface = material.userData.surface as CanSurfaceUniforms | undefined;
    if (surface) {
      surface.uFocus.value = focus;
      material.envMapIntensity = 0.3 + 0.7 * focus;
      surface.uRimStrength.value = 0.9 - 0.55 * focus;
      const physical = material as THREE.MeshPhysicalMaterial;
      if (physical.isMeshPhysicalMaterial) physical.clearcoat = Math.max(0.001, 0.35 * focus * focus); // never 0: avoids a shader recompile
    } else if (material.color) {
      material.color.setScalar(0.06 + 0.79 * focus);
      material.envMapIntensity = 0.3 + 0.7 * focus;
    }
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

/**
 * Creates a watertight procedural can mesh with seamless continuous geometry.
 * ThetaStart = -Math.PI aligns u=0.5 with the front face (+Z), matching can.glb.
 */
export function createProceduralCanGeometry(
  materials: { bodyMat: THREE.Material; aluminumMat: THREE.Material }
): THREE.Group {
  const canGroup = new THREE.Group();
  const radius = 0.55;
  const height = 2.45;

  // 1. Can Body Cylinder (Shell)
  // thetaStart = -Math.PI places u=0.5 precisely at +Z (front)
  const bodyGeo = new THREE.CylinderGeometry(
    radius,
    radius,
    height,
    48,
    1,
    true,
    -Math.PI,
    Math.PI * 2
  );
  const bodyMesh = new THREE.Mesh(bodyGeo, materials.bodyMat);
  bodyMesh.name = 'Shell';
  canGroup.add(bodyMesh);

  // 2. Top Neck Inward Taper (Seamless transition from 0.55 to 0.48)
  const topNeckGeo = new THREE.CylinderGeometry(0.48, radius, 0.16, 48, 1, true);
  const topNeckMesh = new THREE.Mesh(topNeckGeo, materials.aluminumMat);
  topNeckMesh.position.y = height * 0.5 + 0.08;
  canGroup.add(topNeckMesh);

  // 3. Top Rim Chime (Rolled aluminum lip)
  const topRimGeo = new THREE.TorusGeometry(0.48, 0.028, 16, 48);
  topRimGeo.rotateX(Math.PI / 2);
  const topRimMesh = new THREE.Mesh(topRimGeo, materials.aluminumMat);
  topRimMesh.position.y = height * 0.5 + 0.16;
  canGroup.add(topRimMesh);

  // 4. Top Sunken Lid Plate & Pull Tab
  const topLidGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.02, 48);
  const topLidMesh = new THREE.Mesh(topLidGeo, materials.aluminumMat);
  topLidMesh.position.y = height * 0.5 + 0.145;
  canGroup.add(topLidMesh);

  // Pull Tab
  const tabGeo = new THREE.BoxGeometry(0.12, 0.015, 0.22);
  const tabMesh = new THREE.Mesh(tabGeo, materials.aluminumMat);
  tabMesh.position.set(0, height * 0.5 + 0.16, 0.08);
  tabMesh.rotation.x = -0.05;
  canGroup.add(tabMesh);

  // 5. Bottom Inward Taper (Transition from 0.55 to 0.46)
  const botNeckGeo = new THREE.CylinderGeometry(radius, 0.46, 0.15, 48, 1, true);
  const botNeckMesh = new THREE.Mesh(botNeckGeo, materials.aluminumMat);
  botNeckMesh.position.y = -height * 0.5 - 0.075;
  canGroup.add(botNeckMesh);

  // 6. Bottom Concave Dome Cap
  const botCapGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.02, 48);
  const botCapMesh = new THREE.Mesh(botCapGeo, materials.aluminumMat);
  botCapMesh.position.y = -height * 0.5 - 0.15;
  canGroup.add(botCapMesh);

  return canGroup;
}

/**
 * Creates an authentic can mesh using either the official can.glb model
 * or the seamless procedural can fallback.
 */
export function createCanMesh(
  texture: THREE.Texture,
  surface: THREE.Texture | null = null,
  isLowPower: boolean = false,
  normal: THREE.Texture | null = null
): THREE.Group {
  const materials = createCanMaterials(texture, surface, isLowPower, normal);

  // If can.glb is already cached in memory, instantiate from GLB
  if (cachedCanScene) {
    return instantiateGlbCan(cachedCanScene, materials);
  }

  // Otherwise, create watertight procedural can immediately
  const canGroup = createProceduralCanGeometry(materials);

  // Trigger background preload and upgrade when ready
  preloadCanModel()
    .then((glbScene) => {
      // Upgrade existing canGroup in-place
      upgradeCanWithGlb(canGroup, glbScene, materials);
    })
    .catch(() => {
      // Procedural can remains safely active
    });

  return canGroup;
}

/**
 * Clones and configures an instance from the cached can.glb scene.
 */
function instantiateGlbCan(
  template: THREE.Group,
  materials: { bodyMat: THREE.Material; aluminumMat: THREE.Material }
): THREE.Group {
  const group = new THREE.Group();
  const glbInstance = template.clone(true);

  // The GLB has nodes 'Shell', 'Top', 'Bottom' with scale 0.3 and rotation PI/2 on X
  glbInstance.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = false;
      mesh.receiveShadow = false;

      if (mesh.name === 'Shell') {
        mesh.material = materials.bodyMat;
      } else {
        mesh.material = materials.aluminumMat;
      }
      // The domed base: slightly rougher so its curvature catches the soft fill.
      if (mesh.name === 'Bottom') mesh.material = getBaseMaterial(materials.aluminumMat);
    }
  });

  group.add(glbInstance);
  return group;
}

/**
 * Upgrades a procedural can Group with the official GLB geometry.
 */
function upgradeCanWithGlb(
  canGroup: THREE.Group,
  template: THREE.Group,
  materials: { bodyMat: THREE.Material; aluminumMat: THREE.Material }
) {
  // Clear procedural children safely
  while (canGroup.children.length > 0) {
    const child = canGroup.children[0];
    canGroup.remove(child);
  }

  // Add the official GLB hierarchy
  const glbCan = instantiateGlbCan(template, materials);
  while (glbCan.children.length > 0) {
    canGroup.add(glbCan.children[0]);
  }
}

/**
 * Creates the authentic ceiling fixture and floor pedestal using base.glb
 * or a multi-tiered industrial procedural fallback.
 */
export function createBaseDiscs(isLowPower: boolean = false): THREE.Group {
  const baseGroup = new THREE.Group();

  // Polished chrome ceiling disc material — catches brilliant ring highlights
  const topDiscMat = isLowPower
    ? new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        metalness: 0.92,
        roughness: 0.12,
        envMapIntensity: 2.5,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0xd8d8dc,
        metalness: 1,
        roughness: 0.22,
        clearcoat: 0.4,
        clearcoatRoughness: 0.12,
        ior: 2.4,
        envMapIntensity: 0.55,
        reflectivity: 1.0,
      });

  // Dark machined steel floor pedestal
  const botDiscMat = isLowPower
    ? new THREE.MeshStandardMaterial({
        color: 0x383a42,
        metalness: 0.90,
        roughness: 0.22,
        envMapIntensity: 2.2,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0x383a42,
        metalness: 0.92,
        roughness: 0.18,
        clearcoat: 0.85,
        clearcoatRoughness: 0.08,
        ior: 2.0,
        envMapIntensity: 0.8,
        reflectivity: 0.95,
      });

  // Metal tubes
  const tubesMat = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    metalness: 0.96,
    roughness: 0.10,
    envMapIntensity: 1.0,
  });

  // Copper cable
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xcc6633,
    metalness: 0.88,
    roughness: 0.22,
    envMapIntensity: 2.0,
  });

  // Multi-tiered Floor Pedestal (Child 0)
  const floorGroup = new THREE.Group();
  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.1, 0.18, 64), botDiscMat);
  tier1.position.y = -0.09;
  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.85, 0.16, 64), botDiscMat);
  tier2.position.y = 0.08;
  const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.12, 64), botDiscMat);
  tier3.position.y = 0.22;
  floorGroup.add(tier1, tier2, tier3);
  floorGroup.position.y = -3.2;
  baseGroup.add(floorGroup);

  // Multi-tiered Ceiling Cap (Child 1)
  const ceilingGroup = new THREE.Group();
  const cTier1 = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.9, 0.18, 64), topDiscMat);
  cTier1.position.y = 0.09;
  const cTier2 = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.6, 0.16, 64), topDiscMat);
  cTier2.position.y = -0.08;
  const cTier3 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.3, 0.12, 64), topDiscMat);
  cTier3.position.y = -0.22;
  ceilingGroup.add(cTier1, cTier2, cTier3);
  ceilingGroup.position.y = 3.6;
  baseGroup.add(ceilingGroup);

  // Background upgrade with base.glb
  preloadBaseModel()
    .then((glbScene) => {
      const topBase = glbScene.getObjectByName('top_base_metal');
      const botBase = glbScene.getObjectByName('bot_base_metal');

      if (topBase && botBase) {
        // Clear procedural fallbacks
        while (floorGroup.children.length > 0) floorGroup.remove(floorGroup.children[0]);
        while (ceilingGroup.children.length > 0) ceilingGroup.remove(ceilingGroup.children[0]);

        const botClone = botBase.clone(true);
        const topClone = topBase.clone(true);

        botClone.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            const mesh = c as THREE.Mesh;
            if (mesh.name === 'bot_cable_cuivre') {
              mesh.material = copperMat;
            } else if (mesh.name === 'bot_tubes_metal') {
              mesh.material = tubesMat;
            } else {
              mesh.material = botDiscMat;
            }
          }
        });

        topClone.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            (c as THREE.Mesh).material = topDiscMat;
          }
        });

        floorGroup.position.set(0, 0, 0);
        ceilingGroup.position.set(0, 0, 0);
        floorGroup.add(botClone);
        ceilingGroup.add(topClone);
      }
    })
    .catch(() => {
      // Procedural multi-tiered discs remain active
    });

  return baseGroup;
}
