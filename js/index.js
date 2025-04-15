const siteWideCursor = document.querySelector('.custom-cursor');

document.addEventListener('mousemove', (e) => {
	const w = siteWideCursor.clientWidth;
	const h = siteWideCursor.clientHeight;

	siteWideCursor.style.transform = 
		`translate(${e.clientX - w / 2}px, ${e.clientY - h / 2}px)`;
});

document.addEventListener('mousedown', () => {
	siteWideCursor.classList.add('active');
});

document.addEventListener('mouseup', () => {
	siteWideCursor.classList.remove('active');
});

  function openOptions() {
	document.getElementById("main-menu").style.display = "none";
	document.getElementById("options-menu").style.display = "block";
  }

  function closeOptions() {
	document.getElementById("options-menu").style.display = "none";
	document.getElementById("main-menu").style.display = "block";
  }

  function applyOptions() {
	const volume = document.getElementById("volume").value;
	const difficulty = document.getElementById("difficulty").value;
	alert(`FERRAMENTAS EQUIPADAS: FORÇA - ${volume}, DENSIDADE - ${difficulty}`);
	// Adicione aqui a lógica para aplicar as opções
  }

  function showCredits() {
	document.getElementById("main-menu").style.display = "none";
	document.getElementById("credits-menu").style.display = "block";
  }

  function closeCredits() {
	document.getElementById("credits-menu").style.display = "none";
	document.getElementById("main-menu").style.display = "block";
  }

  // Animação de fundo - Troncos caindo com variação
  const lumberjackContainer = document.getElementById('lumberjack-container');
  const numLogs = 25;

  function createLog() {
	const log = document.createElement('div');
	log.classList.add('log');
	const startX = Math.random() * 100;
	const speed = Math.random() * 2 + 3;
	const rotation = Math.random() * 40 - 20;
	const startDelay = Math.random() * 3;

	log.style.setProperty('--rotation', rotation);
	log.style.left = `${startX}vw`;
	log.style.top = `-30px`;
	log.style.animationDuration = `${speed}s`;
	log.style.animationDelay = `${startDelay}s`;
	lumberjackContainer.appendChild(log);

	log.addEventListener('animationiteration', () => {
	  log.remove();
	  createLog();
	});
  }

  for (let i = 0; i < numLogs; i++) {
	createLog();
  }