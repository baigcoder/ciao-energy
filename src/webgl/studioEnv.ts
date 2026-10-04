import * as THREE from 'three';

/**
 * Studio environment for reflections, generated in code (no HDRI file): a black room with one
 * large overhead softbox, a tall cold strip on the left (long body highlight), a dimmer strip on
 * the right, a faint moon-blue floor and a small hard kicker behind. Prefiltered with PMREM.
 * The panels are what the can's satin black, clear coat and silver wordmark actually reflect.
 */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x000000);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const addPanel = (
    width: number,
    height: number,
    colour: THREE.ColorRepresentation,
    radiance: number,
    position: [number, number, number],
    lookAt: [number, number, number] = [0, 0, 0]
  ) => {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    material.color.set(colour).multiplyScalar(radiance);
    const panel = new THREE.Mesh(geometry, material);
    panel.position.set(...position);
    panel.lookAt(...lookAt);
    room.add(panel);
    geometries.push(geometry);
    materials.push(material);
  };

  addPanel(8, 2.4, 0xeaf3ff, 5.2, [0, 7, 2.5]); // overhead softbox: the key
  addPanel(1.1, 9, 0xcfe2ff, 2.8, [-6.5, 0.8, 2.5]); // cold left strip
  addPanel(0.7, 9, 0xb9cfff, 1.0, [6.5, 0.8, -1.5]); // dim right strip
  addPanel(24, 24, 0x2c4260, 0.2, [0, -6, 0]); // moon-blue floor bounce
  addPanel(12, 7, 0xdce8ff, 1.6, [-2, 2, 14]); // frontal fill so labels stay readable
  addPanel(1.6, 1.6, 0xffffff, 5.0, [3.5, 3, -9]); // small hard kicker behind

  const texture = pmrem.fromScene(room, 0.035).texture;
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  pmrem.dispose();
  return texture;
}
