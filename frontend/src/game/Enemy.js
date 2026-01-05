import * as THREE from 'three';

export default class Enemy {
  constructor(scene, playerPos) {
    this.scene = scene;
    this.health = 100;
    this.speed = 0.02;

    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;

    // Spawn at random position
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 20;
    this.mesh.position.set(
      Math.cos(angle) * distance,
      1,
      Math.sin(angle) * distance
    );

    scene.add(this.mesh);
  }

  update(delta, playerPos) {
    const direction = new THREE.Vector3()
      .subVectors(playerPos, this.mesh.position)
      .normalize();
    
    this.mesh.position.add(direction.multiplyScalar(this.speed));
    this.mesh.lookAt(playerPos);
  }

  takeDamage(amount) {
    this.health -= amount;
    
    // Flash red
    this.mesh.material.color.setHex(0xff8888);
    setTimeout(() => {
      this.mesh.material.color.setHex(0xff0000);
    }, 100);

    return this.health <= 0;
  }
}