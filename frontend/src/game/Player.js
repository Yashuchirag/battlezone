import * as THREE from 'three';

export default class Player {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.keys = {};
    this.moveSpeed = 5;
    this.lastShot = 0;

    this.camera.position.set(0, 1.6, 0);

    // Crosshair
    const crosshairGeom = new THREE.RingGeometry(0.008, 0.01, 32);
    const crosshairMat = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      side: THREE.DoubleSide 
    });
    this.crosshair = new THREE.Mesh(crosshairGeom, crosshairMat);
    this.crosshair.position.z = -0.5;
    this.camera.add(this.crosshair);
    this.scene.add(this.camera);

    this.setupControls();
  }

  setupControls() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) {
        this.camera.rotation.y -= e.movementX * 0.002;
        this.camera.rotation.x -= e.movementY * 0.002;
        this.camera.rotation.x = Math.max(
          -Math.PI / 2, 
          Math.min(Math.PI / 2, this.camera.rotation.x)
        );
      }
    });

    document.addEventListener('click', () => {
      if (!document.pointerLockElement) {
        document.body.requestPointerLock();
      }
    });
  }

  update(delta) {
    this.direction.set(0, 0, 0);

    if (this.keys['KeyW']) this.direction.z -= 1;
    if (this.keys['KeyS']) this.direction.z += 1;
    if (this.keys['KeyA']) this.direction.x -= 1;
    if (this.keys['KeyD']) this.direction.x += 1;

    if (this.direction.length() > 0) {
      this.direction.normalize();
      this.velocity.set(this.direction.x, 0, this.direction.z);
      this.velocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
      this.camera.position.add(this.velocity.multiplyScalar(this.moveSpeed * delta));

      // Boundaries
      this.camera.position.x = Math.max(-48, Math.min(48, this.camera.position.x));
      this.camera.position.z = Math.max(-48, Math.min(48, this.camera.position.z));
    }
  }

  shoot() {
    const now = Date.now();
    if (now - this.lastShot < 100) return;
    this.lastShot = now;

    // Muzzle flash
    const flash = new THREE.PointLight(0xffff00, 2, 10);
    flash.position.copy(this.camera.position);
    this.scene.add(flash);
    setTimeout(() => this.scene.remove(flash), 50);
  }

  getDirection() {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    return direction.toArray();
  }
}