import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// =============================================
// CONFIGURAÇÃO INICIAL
// =============================================

// Criação da cena
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xcce0ff, 0.001);


// Estados do ambiente
const environment = {
  isNight: false,
  isRaining: false
};

// Carrega o céu diurno
const skyLoader = new THREE.TextureLoader();
const daySkyTexture = skyLoader.load('./img/sky.jpeg');
daySkyTexture.mapping = THREE.EquirectangularReflectionMapping;

// Textura do céu noturno
const nightSkyTexture = new THREE.TextureLoader().load('./img/night.png');
nightSkyTexture.mapping = THREE.EquirectangularReflectionMapping;
scene.background = daySkyTexture;

// Configuração da câmara (altura fixa)
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000
);
camera.position.set(0, 10, 50);

// Material genérico para vegetação
function createVegetationMaterial(texture) {
  return new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide
  });
}

// =============================================
// CURSOR PERSONALIZADO
// =============================================

const cursor = {
  element: document.createElement('div'),
  axeSound: new Audio('./sounds/chop.mp3'),
  init: function() {
    this.element.style.position = 'fixed';
    this.element.style.width = '32px';
    this.element.style.height = '32px';
    this.element.style.backgroundImage = 'url(./img/axe_cursor.png)';
    this.element.style.backgroundSize = 'contain';
    this.element.style.zIndex = '1000';
    this.element.style.pointerEvents = 'none';
    document.body.appendChild(this.element);
    
    // Configura som
    this.axeSound.volume = 0.7;
    
    // Atualiza posição do cursor
    document.addEventListener('mousemove', (e) => {
      this.element.style.left = `${e.clientX - 16}px`;
      this.element.style.top = `${e.clientY - 16}px`;
    });
    
    // Oculta cursor padrão
    document.body.style.cursor = 'none';
  },
  playSound: function() {
    this.axeSound.currentTime = 0;
    this.axeSound.play();
  }
};

cursor.init();
// =============================================
// CONTROLOS DA CÂMARA
// =============================================

// Variáveis de controle
const controls = {
  rotation: new THREE.Vector2(0, 0),
  movement: {
    forward: false,
    backward: false,
    left: false,
    right: false
  },
  speed: 15,
  rotationSpeed: 0.002
};

// Limites do mundo
const world = {
  size: 100,
  fixedHeight: 3
};

// =============================================
// CONFIGURAÇÃO DO GLTF LOADER
// =============================================
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
gltfLoader.setDRACOLoader(dracoLoader);

// Array para armazenar os modelos de árvores
const treeModels = [];

// Lista de caminhos dos modelos GLTF
const treeModelPaths = [
  './assets/models/trees/island_tree_01/modelo.glb',
  './assets/models/trees/island_tree_02/modelo.glb',
  './assets/models/trees/jacaranda_tree/modelo.glb',
  './assets/models/trees/tree_small_02/modelo.glb'
];

// Carregar todos os modelos de árvores
treeModelPaths.forEach((path, idx) => {
  gltfLoader.load(
    path,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      treeModels[idx] = model;
      // Só cria a floresta quando todos os modelos estiverem carregados
      if (treeModels.filter(Boolean).length === treeModelPaths.length) {
        createForest();
      }
    },
    undefined,
    (error) => {
      console.error('Erro ao carregar modelo:', path, error);
    }
  );
});

// =============================================
// GERADOR DE FLORESTA COM GLTF
// =============================================
function createForest(count = 30) {
  trees = [];
  if (treeModels.length === 0 || treeModels.some(m => !m)) return;

  for (let i = 0; i < count; i++) {
    // Escolhe aleatoriamente um modelo de árvore
    const modelIdx = Math.floor(Math.random() * treeModels.length);
    const tree = treeModels[modelIdx].clone();

    // ...restante código de posicionamento e escala...
    tree.position.x = (Math.random() - 0.5) * world.size * 1.8;
    tree.position.z = (Math.random() - 0.5) * world.size * 1.8;
    tree.position.y = 0;
    const scale = 2.5 + Math.random() * 1.0;
    tree.scale.set(scale, scale, scale);
    tree.rotation.y = Math.random() * Math.PI * 2;
    tree.userData = {
      type: 'tree',
      originalPosition: tree.position.clone(),
      falling: false
    };
    scene.add(tree);
    trees.push(tree);
  }
}

// =============================================
// ELEMENTOS VISUAIS
// =============================================

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: false});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Sistema de partículas para chuva
let rainParticles = createRainParticles();

function createRainParticles() {
  const rainGeometry = new THREE.BufferGeometry();
  const rainCount = 1000; // Número de partículas de chuva

  const positions = new Float32Array(rainCount * 3);
  const sizes = new Float32Array(rainCount);

  for (let i = 0; i < rainCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * world.size * 2;
    positions[i * 3 + 1] = Math.random() * world.size;
    positions[i * 3 + 2] = (Math.random() - 0.5) * world.size * 2;
    sizes[i] = 0.05 + Math.random() * 0.1;
  }

  rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  rainGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const rainMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  const rain = new THREE.Points(rainGeometry, rainMaterial);
  rain.visible = false;
  scene.add(rain);
  return rain;
}

// Luzes
const lights = {
  sun: new THREE.DirectionalLight(0xffffff, 1),
  ambient: new THREE.AmbientLight(0xffffff, 0.6)
};

function setupLights() {
  // Luz solar diurna
  lights.sun.position.set(100, 200, 100);
  lights.sun.castShadow = true;
  lights.sun.shadow.mapSize.width = 512;
  lights.sun.shadow.mapSize.height = 512;
  scene.add(lights.sun);

  // Luz ambiente
  scene.add(lights.ambient);

  updateNightMode();
}

// Criação do terreno
function createGround() {
  const grassLoader = new THREE.TextureLoader();
  grassLoader.load('./assets/models/textures/terrain.jpg', function(texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(world.size / 10, world.size / 10);

    const material = new THREE.MeshLambertMaterial({ 
      map: texture,
      side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneGeometry(world.size * 2, world.size * 2);
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
  });
}


// =============================================
// RAYCASTING PARA INTERAÇÃO
// =============================================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function setupInteraction() {
  renderer.domElement.addEventListener('click', (event) => {
    // Calcula posição normalizada do mouse
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Atualiza raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Verifica interseções com objetos clicáveis
    const intersects = raycaster.intersectObjects([
      ...trees,
      ...bushes
    ]);
    
    // Se encontrou uma árvore, executa ação
    if (intersects.length > 0) {
      const object = intersects[0].object;
      
      if (object.userData.type === 'tree') {
        // Efeito visual de corte
        animateTreeCut(object);
        
        // Toca som de machado
        cursor.playSound();
      }
    }
  });
}


function createWoodParticles(position) {
  const particleCount = 30;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = position.x + (Math.random() - 0.5);
    positions[i+1] = position.y + (Math.random() - 0.5);
    positions[i+2] = position.z + (Math.random() - 0.5);
  }
  
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: 0x8B4513,
    size: 0.1,
    transparent: true,
    opacity: 1,
    sizeAttenuation: true
  });
  
  const particleSystem = new THREE.Points(particles, material);
  scene.add(particleSystem);
  
  // Animação das partículas
  let lifespan = 1.0;
  const originalPositions = positions.slice();
  
  const animateParticles = () => {
    lifespan -= 0.02;
    material.opacity = lifespan;
    
    // Atualiza posições
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] += (Math.random() - 0.5) * 0.1;
      positions[i+1] += 0.1;
      positions[i+2] += (Math.random() - 0.5) * 0.1;
    }
    
    particles.attributes.position.needsUpdate = true;
    
    if (lifespan > 0) {
      requestAnimationFrame(animateParticles);
    } else {
      scene.remove(particleSystem);
      particles.dispose();
      material.dispose();
    }
  };
  
  animateParticles();
}

// Animação de corte de árvore
function animateTreeCut(tree) {
  tree.userData.falling = true;
  
  const fallSpeed = 0.2;
  const rotationSpeed = 0.05;
  
  const animateFall = () => {
    if (!tree.userData.falling) return;
    
    tree.rotation.z += rotationSpeed;
    tree.position.y -= fallSpeed;
    
    // Verificar se a árvore já caiu o suficiente
    if (tree.position.y > -10) {
      requestAnimationFrame(animateFall);
    } else {
      // Remover árvore da cena
      scene.remove(tree);
      
      // Remover da lista de árvores
      const index = trees.indexOf(tree);
      if (index > -1) {
        trees.splice(index, 1);
      }
    }
  };
  
  animateFall();
  createWoodParticles(tree.position.clone());
}


// =============================================
// CONTROLOS INTERATIVOS
// =============================================

function setupKeyboardControls() {
  document.addEventListener('keydown', (e) => {
    switch (e.keyCode) {
      case 87: // W - frente
        controls.movement.forward = true;
        break;
      case 83: // S - trás
        controls.movement.backward = true;
        break;
      case 65: // A - esquerda
        controls.movement.left = true;
        break;
      case 68: // D - direita
        controls.movement.right = true;
        break;
      case 78: // N - alternar noite/dia
        toggleNightMode();
        break;
      case 82: // R - alternar chuva
        toggleRain();
        break;
    }
  });

  document.addEventListener('keyup', (e) => {
    switch (e.keyCode) {
      case 87: controls.movement.forward = false; break;
      case 83: controls.movement.backward = false; break;
      case 65: controls.movement.left = false; break;
      case 68: controls.movement.right = false; break;
    }
  });
}

function setupMouseControls() {
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
      const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
      const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

      controls.rotation.x -= movementX * controls.rotationSpeed;
      controls.rotation.y -= movementY * controls.rotationSpeed;

      controls.rotation.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, controls.rotation.y));
    }
  });

  renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock =
      renderer.domElement.requestPointerLock ||
      renderer.domElement.mozRequestPointerLock ||
      renderer.domElement.webkitRequestPointerLock;
    renderer.domElement.requestPointerLock();
  });
}

// =============================================
// LÓGICA DO AMBIENTE
// =============================================

function toggleNightMode() {
  environment.isNight = !environment.isNight;
  updateNightMode();
}

function updateNightMode() {
  if (environment.isNight) {
    scene.background = nightSkyTexture;
    lights.sun.intensity = 0.3;
    lights.ambient.intensity = 0.2;
    lights.sun.color.setHex(0x4444aa);

    // Ajusta a chuva para modo noturno
    if (environment.isRaining) {
      rainParticles.material.color.setHex(0x9999ff);
      rainParticles.material.opacity = 0.6;
    }
  } else {
    scene.background = daySkyTexture;
    lights.sun.intensity = 1;
    lights.ambient.intensity = 0.6;
    lights.sun.color.setHex(0xffffff);

    // Ajusta a chuva para modo diurno
    if (environment.isRaining) {
      rainParticles.material.color.setHex(0xaaaaaa);
      rainParticles.material.opacity = 0.8;
    }
  }
}

function toggleRain() {
  environment.isRaining = !environment.isRaining;
  rainParticles.visible = environment.isRaining;

  // Ajusta a aparência da chuva conforme o modo
  if (environment.isRaining) {
    if (environment.isNight) {
      rainParticles.material.color.setHex(0x9999ff);
      rainParticles.material.opacity = 0.6;
    } else {
      rainParticles.material.color.setHex(0xaaaaaa);
      rainParticles.material.opacity = 0.8;
    }
  }

  // Ajusta a iluminação quando chove
  if (environment.isRaining) {
    lights.sun.intensity *= 0.7;
    lights.ambient.intensity *= 0.7;
  } else {
    if (environment.isNight) {
      lights.sun.intensity = 0.3;
      lights.ambient.intensity = 0.2;
    } else {
      lights.sun.intensity = 1;
      lights.ambient.intensity = 0.6;
    }
  }
}

function updateRain() {
  if (!environment.isRaining) return;

  const positions = rainParticles.geometry.attributes.position.array;
  const resetY = world.size;

  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] -= 2.5; // Velocidade da chuva

    // Reinicia as partículas que chegam no chão
    if (positions[i + 1] < 0) {
      positions[i + 1] = Math.random() * resetY + resetY;
      positions[i] = (Math.random() - 0.5) * world.size * 2;
      positions[i + 2] = (Math.random() - 0.5) * world.size * 2;
    }
  }

  rainParticles.geometry.attributes.position.needsUpdate = true;
}

// =============================================
// LÓGICA DO JOGO
// =============================================

let trees = [];
let bushes = [];

function updateCamera(delta) {
  const direction = new THREE.Vector3();

  direction.z = Number(controls.movement.backward) - Number(controls.movement.forward);
  direction.x = Number(controls.movement.right) - Number(controls.movement.left);
  direction.normalize();

  const yaw = controls.rotation.x;
  const forwardX = Math.sin(yaw) * direction.z + Math.cos(yaw) * direction.x;
  const forwardZ = Math.cos(yaw) * direction.z - Math.sin(yaw) * direction.x;

  camera.position.x += forwardX * controls.speed * delta;
  camera.position.z += forwardZ * controls.speed * delta;

  // Mantém altura fixa
  camera.position.y = world.fixedHeight;

  // Limita movimento horizontal
  camera.position.x = Math.max(-world.size, Math.min(world.size, camera.position.x));
  camera.position.z = Math.max(-world.size, Math.min(world.size, camera.position.z));

  camera.rotation.set(controls.rotation.y, controls.rotation.x, 0, 'YXZ');
  //trees.forEach(tree => tree.lookAt(camera.position));
  //bushes.forEach(bush => bush.lookAt(camera.position));
}

// Loop de animação
let lastTime = 0;
function animate(currentTime = 0) {
  requestAnimationFrame(animate);

  const delta = Math.min(0.1, (currentTime - lastTime) / 1000);
  lastTime = currentTime;

  updateCamera(delta);
  updateRain();
  renderer.render(scene, camera);
}

// =============================================
// INICIALIZAÇÃO
// =============================================

function init() {
  setupLights();
  createGround();
  
 
  setupKeyboardControls();
  setupMouseControls();
  setupInteraction(); // Configura interação com clique

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}


// ...existing code...

// ===== LOADING SCREEN =====
const loadingScreen = document.createElement('div');
loadingScreen.id = 'loading-screen';
loadingScreen.style.position = 'fixed';
loadingScreen.style.top = 0;
loadingScreen.style.left = 0;
loadingScreen.style.width = '100vw';
loadingScreen.style.height = '100vh';
loadingScreen.style.background = 'rgba(101, 67, 33, 0.85)';
loadingScreen.style.color = '#fff';
loadingScreen.style.display = 'flex';
loadingScreen.style.flexDirection = 'column';
loadingScreen.style.alignItems = 'center';
loadingScreen.style.justifyContent = 'center';
loadingScreen.style.fontSize = '2em';
loadingScreen.style.zIndex = 9999;


const spinner = document.createElement('div');
spinner.style.border = '10px solid #e0c097';
spinner.style.borderTop = '10px solid #fff';
spinner.style.borderRadius = '50%';
spinner.style.width = '70px';
spinner.style.height = '70px';
spinner.style.marginBottom = '30px';
spinner.style.animation = 'spin 1s linear infinite';
spinner.style.boxShadow = '0 0 20px #0008';

const style = document.createElement('style');
style.innerHTML = `
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}
#loading-screen { user-select: none; }
`;
document.head.appendChild(style);

loadingScreen.appendChild(spinner);

const loadingText = document.createElement('div');
loadingText.innerText = 'A carregar...';
loadingScreen.appendChild(loadingText);

document.body.appendChild(loadingScreen);


// Carregar todos os modelos de árvores
let loadedModels = 0;
treeModelPaths.forEach((path, idx) => {
  gltfLoader.load(
    path,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      treeModels[idx] = model;
      loadedModels++;
      // Atualiza texto do loading
      loadingScreen.innerText = `A carregar árvores... (${loadedModels}/${treeModelPaths.length})`;
      // Só cria a floresta quando todos os modelos estiverem carregados
      if (treeModels.filter(Boolean).length === treeModelPaths.length) {
        createForest();
        // Esconde o loading screen
        loadingScreen.style.display = 'none';
      }
    },
    undefined,
    (error) => {
      console.error('Erro ao carregar modelo:', path, error);
      loadedModels++;
      loadingScreen.innerText = `A carregar árvores... (${loadedModels}/${treeModelPaths.length})`;
      if (treeModels.filter(Boolean).length === treeModelPaths.length) {
        createForest();
        loadingScreen.style.display = 'none';
      }
    }
  );
});

// ...existing code...

init();