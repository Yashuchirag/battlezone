import * as THREE from 'three';

export default class World {
  constructor(scene) {
    this.scene = scene;
    this.createEnvironment();
  }

  createEnvironment() {
    // Sky
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 0, 100);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    this.scene.add(dirLight);

    // Ground
    const groundGeom = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a8c3a });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Walls
    this.createWalls();
    this.createObstacles();
  }

  createWalls() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const walls = [
      { pos: [0, 2.5, -50], size: [100, 5, 1] },
      { pos: [0, 2.5, 50], size: [100, 5, 1] },
      { pos: [-50, 2.5, 0], size: [1, 5, 100] },
      { pos: [50, 2.5, 0], size: [1, 5, 100] }
    ];

    walls.forEach(w => {
      const geom = new THREE.BoxGeometry(...w.size);
      const mesh = new THREE.Mesh(geom, wallMat);
      mesh.position.set(...w.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });
  }

  createObstacles() {
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    
    for (let i = 0; i < 10; i++) {
      const geom = new THREE.BoxGeometry(2, 3, 2);
      const mesh = new THREE.Mesh(geom, boxMat);
      mesh.position.set(
        Math.random() * 80 - 40,
        1.5,
        Math.random() * 80 - 40
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }
  }
}