import * as THREE from 'three';
import Player from './Player';
import World from './World';
import Enemy from './Enemy';
import { socket } from '../utils/socket';

export default class GameManager {
  constructor(container, playerName, onStateChange) {
      this.container = container;
      this.playerName = playerName;
      this.onStateChange = onStateChange;
      
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      container.appendChild(this.renderer.domElement);

      this.clock = new THREE.Clock();
      this.world = new World(this.scene);
      this.player = new Player(this.camera, this.scene);
      this.enemies = [];
      this.remotePlayers = new Map();

      this.state = {
        score: 0,
        ammo: 30,
        health: 100,
        kills: 0
      };

      this.hasDied = false;

      this.setupEventListeners();
      this.spawnEnemies(5);
    }

    setupEventListeners() {
      window.addEventListener('resize', () => this.onResize());
      document.addEventListener('click', () => this.handleShoot());
      document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyR') this.reload();
      });
    }

    spawnEnemies(count) {
      for (let i = 0; i < count; i++) {
        const enemy = new Enemy(this.scene, this.camera.position);
        this.enemies.push(enemy);
      }
    }

    handleShoot() {
      if (this.state.ammo <= 0) return;

      this.state.ammo--;
      this.player.shoot();

      // Emit shot to server
      socket.emit('playerShot', {
        position: this.camera.position.toArray(),
        direction: this.player.getDirection()
      });

      // Check hits
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
      
      const targets = this.enemies.map(e => e.mesh);
      const intersects = raycaster.intersectObjects(targets);

      if (intersects.length > 0) {
        const hitEnemy = this.enemies.find(e => e.mesh === intersects[0].object);
        if (hitEnemy && hitEnemy.takeDamage(50)) {
          this.scene.remove(hitEnemy.mesh);
          this.enemies = this.enemies.filter(e => e !== hitEnemy);
          this.state.score += 10;
          this.state.kills++;

          if (socket) {
            socket.emit('statsUpdate', { kills: 1, score: 10 });
          }
          
          if (this.enemies.length < 5) {
            this.spawnEnemies(1);
          }
        }
      }

      this.updateState();
    }

    reload() {
      this.state.ammo = 30;
      this.updateState();
    }

    addRemotePlayer(data) {
      const geometry = new THREE.BoxGeometry(0.5, 1.8, 0.5);
      const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...data.position);
      this.scene.add(mesh);
      this.remotePlayers.set(data.id, mesh);
    }

    updateRemotePlayer(data) {
      const player = this.remotePlayers.get(data.id);
      if (player) {
        player.position.set(...data.position);
        player.rotation.y = data.rotation;
      }
    }

    removeRemotePlayer(id) {
      const player = this.remotePlayers.get(id);
      if (player) {
        this.scene.remove(player);
        this.remotePlayers.delete(id);
      }
    }

    handleRemoteShot(data) {
      // Visual effect for remote player shooting
      const flash = new THREE.PointLight(0xffff00, 2, 10);
      flash.position.set(...data.position);
      this.scene.add(flash);
      setTimeout(() => this.scene.remove(flash), 50);
    }

    syncGameState(state) {
      // Sync enemies, power-ups, etc.
    }

    updateState() {
      this.onStateChange({ ...this.state });
    }

    start() {
      this.animate();
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      const delta = this.clock.getDelta();
      
      // Update player
      this.player.update(delta);
      
      // Update enemies
      this.enemies.forEach(enemy => {
        enemy.update(delta, this.camera.position);
        
        // Check collision with player
        if (enemy.mesh.position.distanceTo(this.camera.position) < 1.5) {
          this.state.health = Math.max(0, this.state.health - 0.5);
          this.updateState();

          if (this.state.health === 0 && !this.hasDied) {
            this.hasDied = true;
            if (socket) {
              socket.emit('statsUpdate', { deaths: 1 });
            }
          }
        }
      });

      // Emit player position
      socket.emit('playerMoved', {
        position: this.camera.position.toArray(),
        rotation: this.camera.rotation.y
      });

      this.renderer.render(this.scene, this.camera);
    }

    onResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    destroy() {
      window.removeEventListener('resize', () => this.onResize());
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
}