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
    const daySkyTexture = skyLoader.load('https://static.vecteezy.com/system/resources/previews/042/818/355/non_2x/8bit-pixel-graphic-blue-sky-background-with-clouds-vector.jpg');
    daySkyTexture.mapping = THREE.EquirectangularReflectionMapping;

    // Textura do céu noturno
    const nightSkyTexture = new THREE.TextureLoader().load('https://www.skymarvels.com/infinity/infinity%20-%20star%20sky%20-%20texture.jpg');
    nightSkyTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = daySkyTexture;

    // Configuração da câmera (altura fixa)
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 10, 50);

    // =============================================
    // CONTROLES DA CÂMERA
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
      size: 300,
      fixedHeight: 5
    };

    // =============================================
    // ELEMENTOS VISUAIS
    // =============================================

    // Renderizador
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Sistema de partículas para chuva
    let rainParticles = createRainParticles();

    function createRainParticles() {
      const rainGeometry = new THREE.BufferGeometry();
      const rainCount = 4000; // Número de partículas de chuva
      
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
      lights.sun.shadow.mapSize.width = 2048;
      lights.sun.shadow.mapSize.height = 2048;
      scene.add(lights.sun);
      
      // Luz ambiente
      scene.add(lights.ambient);
      
      updateNightMode();
    }

    // Criação do terreno
    function createGround() {
      const grassLoader = new THREE.TextureLoader();
      grassLoader.load('https://i.redd.it/5m8846s5ix601.png', function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(world.size/10, world.size/10);

        const material = new THREE.MeshLambertMaterial({ 
          map: texture,
          side: THREE.DoubleSide
        });

        const geometry = new THREE.PlaneGeometry(world.size*2, world.size*2);
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
      });
    }

    // Criação de árvores
    function createTrees(count = 50) {
      const treeLoader = new THREE.TextureLoader();
      
      treeLoader.load('../img/leaves.png', function(texture) {
        const leavesMaterial = new THREE.SpriteMaterial({ 
          map: texture,
          color: 0x55aa55,
          transparent: true
        });

        const trunkMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x8B4513 
        });

        for (let i = 0; i < count; i++) {
          const tree = new THREE.Group();
          
          const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
          const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
          trunk.position.y = 2.5;
          trunk.castShadow = true;
          tree.add(trunk);

          const leaves = new THREE.Sprite(leavesMaterial);
          leaves.position.y = 7;
          leaves.scale.set(8, 8, 1);
          tree.add(leaves);

          tree.position.x = (Math.random() - 0.5) * world.size * 1.8;
          tree.position.z = (Math.random() - 0.5) * world.size * 1.8;
          
          const scale = 0.8 + Math.random() * 0.4;
          tree.scale.set(scale, scale, scale);

          scene.add(tree);
        }
      });
    }

    // =============================================
    // CONTROLES INTERATIVOS
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
          
          controls.rotation.y = Math.max(-Math.PI/2, Math.min(Math.PI/2, controls.rotation.y));
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
      createTrees(80);
      setupKeyboardControls();
      setupMouseControls();
      
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      animate();
    }

    init();