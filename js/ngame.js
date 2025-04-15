import * as CANNON from 'cannon-es';

// =============================================
// CONFIGURAÇÕES INICIAIS
// =============================================

// Cena Three.js
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xcce0ff, 0.001);

// Mundo físico Cannon.js
const physicsWorld = new CANNON.World();
physicsWorld.gravity.set(0, -9.82, 0);
physicsWorld.solver.iterations = 10;

// Estados do jogo
const environment = {
  isNight: false,
  isRaining: false
};

const gameState = {
  trees: [],
  maxChopDistance: 5
};

// =============================================
// CLASSE DA ÁRVORE COM FÍSICA
// =============================================

class Tree {
  constructor(x, z, scale) {
    this.group = new THREE.Group();
    this.isFallen = false;
    this.hitsRequired = Math.floor(3 + Math.random() * 3); // 3-5 golpes
    this.currentHits = 0;
    this.scale = scale;

    // Tronco visual
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    this.trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial);
    this.trunkMesh.position.y = 2.5;
    this.trunkMesh.castShadow = true;

    // Folhas
    const leavesTexture = new THREE.TextureLoader().load('../img/leaves.png');
    const leavesMaterial = new THREE.SpriteMaterial({
      map: leavesTexture,
      color: 0x55aa55,
      transparent: true
    });
    this.leavesSprite = new THREE.Sprite(leavesMaterial);
    this.leavesSprite.position.y = 7;
    this.leavesSprite.scale.set(8, 8, 1);

    // Montagem do grupo
    this.group.add(this.trunkMesh);
    this.group.add(this.leavesSprite);
    this.group.position.set(x, 0, z);
    this.group.scale.set(scale, scale, scale);

    // Corpo físico
    this.physicsBody = new CANNON.Body({
      mass: 10,
      position: new CANNON.Vec3(x, 2.5, z),
      shape: new CANNON.Cylinder(0.4*scale, 0.7*scale, 5*scale, 8),
      material: new CANNON.Material()
    });
    this.physicsBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(0, 0, 1),
      Math.PI/2
    );
    physicsWorld.addBody(this.physicsBody);
  }

  shake() {
    if(this.isFallen) return;
    
    // Animação de tremor
    gsap.to(this.group.position, {
      x: `+=${0.1*this.scale}`,
      yoyo: true,
      repeat: 2,
      duration: 0.05
    });
  }

  chop() {
    if(this.isFallen) return;
    
    this.currentHits++;
    this.shake();
    
    if(this.currentHits >= this.hitsRequired) {
      this.fall();
    }
  }

  fall() {
    this.isFallen = true;
    this.physicsBody.applyLocalForce(
      new CANNON.Vec3(0, 0, -300*this.scale),
      new CANNON.Vec3(0, 2.5*this.scale, 0)
    );
  }
}

// =============================================
// SISTEMA DE CORTE DE ÁRVORES
// =============================================

function setupTreeChopping() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  document.addEventListener('click', (e) => {
    if(document.pointerLockElement === renderer.domElement) {
      // Calcular posição do mouse
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      
      // Verificar colisão
      const intersects = raycaster.intersectObjects(
        gameState.trees.map(t => t.group),
        true
      );

      if(intersects.length > 0) {
        const tree = gameState.trees.find(t => t.group === intersects[0].object.parent);
        const distance = camera.position.distanceTo(tree.group.position);
        
        if(distance <= gameState.maxChopDistance) {
          tree.chop();
        }
      }
    }
  });
}

// =============================================
// CONFIGURAÇÃO DA CENA
// =============================================

// [Restante do código original mantido...]
// (Configuração de câmera, iluminação, terreno, etc.)

// Modificar a função createTrees
function createTrees(count = 50) {
  for(let i = 0; i < count; i++) {
    const scale = 0.8 + Math.random() * 0.4;
    const x = (Math.random() - 0.5) * world.size * 1.8;
    const z = (Math.random() - 0.5) * world.size * 1.8;
    
    const tree = new Tree(x, z, scale);
    gameState.trees.push(tree);
    scene.add(tree.group);
  }
}

// Atualizar loop de animação
function animate(currentTime = 0) {
  requestAnimationFrame(animate);
  
  const delta = Math.min(0.1, (currentTime - lastTime) / 1000);
  lastTime = currentTime;

  // Atualizar física
  physicsWorld.step(delta);
  
  // Sincronizar posições
  gameState.trees.forEach(tree => {
    if(tree.isFallen) {
      tree.group.position.copy(tree.physicsBody.position);
      tree.group.quaternion.copy(tree.physicsBody.quaternion);
    }
  });

  updateCamera(delta);
  updateRain();
  renderer.render(scene, camera);
}

// Inicialização
function init() {
  setupLights();
  createGround();
  createTrees(80);
  setupKeyboardControls();
  setupMouseControls();
  setupTreeChopping(); // Novo sistema de corte

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}

init();