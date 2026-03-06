import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

const canvas = document.querySelector("#game");
const scoreLabel = document.querySelector("#score");
const bestScoreLabel = document.querySelector("#best-score");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayText = document.querySelector("#overlay-text");
const actionButton = document.querySelector("#action-button");
const jumpButton = document.querySelector("#jump-button");
const restartButton = document.querySelector("#restart-button");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xfff5dd, 12, 36);

const world = {
  width: 20,
  height: 12,
  groundY: -3.45,
};

const camera = new THREE.OrthographicCamera(
  -world.width / 2,
  world.width / 2,
  world.height / 2,
  -world.height / 2,
  0.1,
  100,
);
camera.position.set(0, 0.2, 12);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.55);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff1c1, 1.35);
sunLight.position.set(4, 8, 8);
scene.add(sunLight);

const palette = {
  peach: 0xfbd2c7,
  peachDark: 0xf7b0a0,
  cream: 0xfff5e8,
  pink: 0xff8fab,
  pinkSoft: 0xffcad4,
  mint: 0x8bdcc8,
  mintDark: 0x58b9a1,
  sky: 0xfff1c5,
  grass: 0xc6efc3,
  grassDark: 0x8fd68f,
  hill: 0xf4b8c2,
  hill2: 0xaed9ff,
  crow: 0x312532,
  crowWing: 0x463347,
  shadow: 0xd1897b,
};

function roundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const left = -width / 2;
  const right = width / 2;
  const top = height / 2;
  const bottom = -height / 2;

  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.quadraticCurveTo(right, bottom, right, bottom + radius);
  shape.lineTo(right, top - radius);
  shape.quadraticCurveTo(right, top, right - radius, top);
  shape.lineTo(left + radius, top);
  shape.quadraticCurveTo(left, top, left, top - radius);
  shape.lineTo(left, bottom + radius);
  shape.quadraticCurveTo(left, bottom, left + radius, bottom);
  return shape;
}

function createFlatMesh(geometry, color) {
  return new THREE.Mesh(
    geometry,
    new THREE.MeshToonMaterial({ color, transparent: true }),
  );
}

function createHill(width, height, color) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.quadraticCurveTo(0, height / 1.4, width / 2, -height / 2);
  shape.lineTo(-width / 2, -height / 2);
  const geometry = new THREE.ShapeGeometry(shape);
  return createFlatMesh(geometry, color);
}

function addBackground() {
  const skyShape = roundedRectShape(44, 24, 1.8);
  const sky = createFlatMesh(new THREE.ShapeGeometry(skyShape), 0xfff0d7);
  sky.position.set(0, 0.7, -8);
  scene.add(sky);

  const sun = createFlatMesh(new THREE.CircleGeometry(1.1, 32), 0xffd166);
  sun.position.set(6.8, 3.6, -7.2);
  scene.add(sun);

  const sunHalo = createFlatMesh(new THREE.CircleGeometry(1.75, 32), 0xfff1aa);
  sunHalo.material.opacity = 0.35;
  sunHalo.position.set(6.8, 3.6, -7.3);
  scene.add(sunHalo);

  const hillBack = createHill(20, 6, palette.hill2);
  hillBack.position.set(-2, -1.6, -6);
  scene.add(hillBack);

  const hillMid = createHill(16, 5, palette.hill);
  hillMid.position.set(3.8, -1.95, -5.2);
  scene.add(hillMid);

  const hillFront = createHill(18, 4.5, 0xffd8cf);
  hillFront.position.set(-5, -2.15, -4.8);
  scene.add(hillFront);

  const cloudGroup = new THREE.Group();
  scene.add(cloudGroup);

  for (let i = 0; i < 7; i += 1) {
    const cloud = new THREE.Group();
    const puffA = createFlatMesh(new THREE.CircleGeometry(0.48, 16), 0xffffff);
    const puffB = createFlatMesh(new THREE.CircleGeometry(0.63, 16), 0xffffff);
    const puffC = createFlatMesh(new THREE.CircleGeometry(0.42, 16), 0xffffff);
    puffA.position.set(-0.42, -0.02, 0);
    puffC.position.set(0.45, -0.08, 0);
    puffB.position.set(0, 0.15, 0.02);
    cloud.add(puffA, puffB, puffC);
    cloud.position.set(-8 + i * 3.2, 2 + ((i % 3) * 0.5), -6.7 + (i % 2) * 0.2);
    cloud.userData.speed = 0.12 + (i % 3) * 0.03;
    cloudGroup.add(cloud);
  }

  const groundBase = createFlatMesh(
    new THREE.PlaneGeometry(44, 4),
    palette.grass,
  );
  groundBase.position.set(0, world.groundY - 1.55, -1.5);
  scene.add(groundBase);

  const grassStrip = createFlatMesh(
    new THREE.PlaneGeometry(44, 1.4),
    palette.grassDark,
  );
  grassStrip.position.set(0, world.groundY - 0.25, -1.1);
  scene.add(grassStrip);

  return { cloudGroup };
}

function createSparkleTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 128;
  textureCanvas.height = 128;
  const ctx = textureCanvas.getContext("2d");
  ctx.clearRect(0, 0, 128, 128);

  for (let i = 0; i < 18; i += 1) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const size = 2 + Math.random() * 5;
    ctx.fillStyle = i % 2 === 0 ? "#fff7cf" : "#ffd2de";
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.5, 1.4);
  return texture;
}

const sparkleTexture = createSparkleTexture();
const sparkleBand = new THREE.Mesh(
  new THREE.PlaneGeometry(44, 1.8),
  new THREE.MeshBasicMaterial({
    map: sparkleTexture,
    transparent: true,
    opacity: 0.42,
  }),
);
sparkleBand.position.set(0, world.groundY + 0.55, -0.9);
scene.add(sparkleBand);

function createCat() {
  const root = new THREE.Group();

  const shadow = createFlatMesh(new THREE.CircleGeometry(0.8, 20), 0xd28a79);
  shadow.material.opacity = 0.28;
  shadow.scale.set(1.2, 0.45, 1);
  shadow.position.set(-0.1, -1.15, -0.4);
  root.add(shadow);

  const body = createFlatMesh(
    new THREE.ShapeGeometry(roundedRectShape(2.15, 1.5, 0.45)),
    palette.peach,
  );
  root.add(body);

  const belly = createFlatMesh(
    new THREE.ShapeGeometry(roundedRectShape(1.15, 0.75, 0.3)),
    palette.cream,
  );
  belly.position.set(0.1, -0.18, 0.05);
  root.add(belly);

  const head = createFlatMesh(new THREE.CircleGeometry(0.82, 28), palette.peach);
  head.position.set(0.78, 0.72, 0.08);
  root.add(head);

  const earGeometry = new THREE.ShapeGeometry(
    (() => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.4);
      shape.lineTo(0.35, -0.38);
      shape.lineTo(-0.35, -0.38);
      shape.closePath();
      return shape;
    })(),
  );

  const earLeft = createFlatMesh(earGeometry, palette.peachDark);
  earLeft.position.set(0.42, 1.48, 0.06);
  earLeft.rotation.z = -0.16;
  root.add(earLeft);

  const earRight = createFlatMesh(earGeometry, palette.peachDark);
  earRight.position.set(1.14, 1.46, 0.06);
  earRight.rotation.z = 0.16;
  root.add(earRight);

  const eyeLeft = createFlatMesh(new THREE.CircleGeometry(0.075, 14), 0x3c2d38);
  eyeLeft.position.set(0.55, 0.8, 0.22);
  root.add(eyeLeft);

  const eyeRight = eyeLeft.clone();
  eyeRight.position.x = 0.96;
  root.add(eyeRight);

  const nose = createFlatMesh(new THREE.CircleGeometry(0.065, 12), 0xf67b9d);
  nose.scale.y = 0.7;
  nose.position.set(0.76, 0.58, 0.2);
  root.add(nose);

  const blushLeft = createFlatMesh(new THREE.CircleGeometry(0.11, 12), 0xffa3b9);
  blushLeft.material.opacity = 0.6;
  blushLeft.position.set(0.39, 0.55, 0.18);
  root.add(blushLeft);

  const blushRight = blushLeft.clone();
  blushRight.position.x = 1.12;
  root.add(blushRight);

  const pawGroup = new THREE.Group();
  root.add(pawGroup);

  const paws = [];
  for (let i = 0; i < 4; i += 1) {
    const paw = createFlatMesh(
      new THREE.ShapeGeometry(roundedRectShape(0.28, 0.82, 0.14)),
      palette.cream,
    );
    paw.position.set(-0.65 + i * 0.42, -0.9, 0.02);
    paw.userData.baseY = paw.position.y;
    pawGroup.add(paw);
    paws.push(paw);
  }

  const tail = createFlatMesh(
    new THREE.ShapeGeometry(roundedRectShape(1.15, 0.28, 0.14)),
    palette.peachDark,
  );
  tail.position.set(-1.3, 0.25, -0.02);
  tail.rotation.z = 0.62;
  root.add(tail);

  const ribbon = createFlatMesh(
    new THREE.ShapeGeometry(roundedRectShape(0.5, 0.18, 0.08)),
    palette.pink,
  );
  ribbon.position.set(0.15, 0.3, 0.1);
  ribbon.rotation.z = -0.08;
  root.add(ribbon);

  root.position.set(-5.5, world.groundY + 0.92, 0.5);
  root.scale.setScalar(0.96);

  return {
    root,
    shadow,
    head,
    body,
    tail,
    paws,
  };
}

function createCrow() {
  const root = new THREE.Group();

  const body = createFlatMesh(
    new THREE.ShapeGeometry(roundedRectShape(1.1, 0.62, 0.22)),
    palette.crow,
  );
  root.add(body);

  const head = createFlatMesh(new THREE.CircleGeometry(0.28, 20), palette.crow);
  head.position.set(0.56, 0.17, 0.02);
  root.add(head);

  const beakShape = new THREE.Shape();
  beakShape.moveTo(0, 0);
  beakShape.lineTo(0.26, 0.08);
  beakShape.lineTo(0.26, -0.08);
  beakShape.closePath();
  const beak = createFlatMesh(new THREE.ShapeGeometry(beakShape), 0xf2b84a);
  beak.position.set(0.82, 0.12, 0.04);
  root.add(beak);

  const wingLeft = createFlatMesh(
    new THREE.ShapeGeometry(roundedRectShape(0.7, 0.25, 0.1)),
    palette.crowWing,
  );
  wingLeft.position.set(-0.06, 0.05, -0.02);
  wingLeft.rotation.z = 0.3;
  root.add(wingLeft);

  const wingRight = wingLeft.clone();
  wingRight.scale.y = -1;
  wingRight.rotation.z = -0.3;
  root.add(wingRight);

  const eye = createFlatMesh(new THREE.CircleGeometry(0.03, 8), 0xffffff);
  eye.position.set(0.62, 0.2, 0.1);
  root.add(eye);

  root.userData = {
    wingLeft,
    wingRight,
    flapOffset: Math.random() * Math.PI * 2,
    bobOffset: Math.random() * Math.PI * 2,
    hitWidth: 0.88,
    hitHeight: 0.62,
  };

  return root;
}

function createPuff(color) {
  const mesh = createFlatMesh(new THREE.CircleGeometry(0.12, 12), color);
  mesh.material.opacity = 0.7;
  return mesh;
}

const background = addBackground();
const cat = createCat();
scene.add(cat.root);

const runner = {
  positionY: cat.root.position.y,
  velocityY: 0,
  jumpsUsed: 0,
  onGround: true,
  jumpQueued: false,
  spinAngle: 0,
  spinVelocity: 0,
  hitWidth: 1.55,
  hitHeight: 1.75,
};

const obstacleGroup = new THREE.Group();
scene.add(obstacleGroup);

const particlesGroup = new THREE.Group();
scene.add(particlesGroup);

const groundLines = [];
for (let i = 0; i < 15; i += 1) {
  const line = createFlatMesh(
    new THREE.ShapeGeometry(roundedRectShape(1.05, 0.12, 0.06)),
    i % 2 === 0 ? 0xb8e7ac : 0x9eda8f,
  );
  line.position.set(-10 + i * 1.6, world.groundY - 0.05, -0.8);
  groundLines.push(line);
  scene.add(line);
}

const gameState = {
  isPlaying: false,
  isGameOver: false,
  score: 0,
  bestScore: Number.parseInt(localStorage.getItem("cat-run-best") ?? "0", 10),
  speed: 8.6,
  spawnTimer: 1.9,
  obstacles: [],
  particles: [],
  elapsed: 0,
};

bestScoreLabel.textContent = String(gameState.bestScore);

function resizeRenderer() {
  const { clientWidth, clientHeight } = canvas;
  const aspect = clientWidth / Math.max(clientHeight, 1);
  const height = 12;
  camera.left = (-height * aspect) / 2;
  camera.right = (height * aspect) / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight, false);
}

function setOverlay(title, text, buttonText, visible = true) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  actionButton.textContent = buttonText;
  overlay.classList.toggle("is-hidden", !visible);
}

function spawnJumpPuffs(count = 6) {
  for (let i = 0; i < count; i += 1) {
    const puff = createPuff(i % 2 === 0 ? 0xffffff : palette.pinkSoft);
    puff.position.set(
      cat.root.position.x - 0.28 + Math.random() * 0.66,
      world.groundY - 0.45 + Math.random() * 0.22,
      0.2,
    );
    puff.userData = {
      vx: -0.8 + Math.random() * 1.6,
      vy: 1.1 + Math.random() * 1.4,
      life: 0.45 + Math.random() * 0.18,
      maxLife: 0.62,
    };
    gameState.particles.push(puff);
    particlesGroup.add(puff);
  }
}

function triggerJump() {
  if (gameState.isGameOver) {
    restartGame();
    return;
  }

  if (!gameState.isPlaying) {
    startGame();
  }

  if (runner.jumpsUsed >= 2) {
    return;
  }

  runner.jumpsUsed += 1;
  runner.onGround = false;
  runner.velocityY = runner.jumpsUsed === 1 ? 12.6 : 11.2;
  spawnJumpPuffs(runner.jumpsUsed === 1 ? 7 : 10);

  if (runner.jumpsUsed === 2) {
    runner.spinVelocity = Math.PI * 7.2;
  }
}

function startGame() {
  gameState.isPlaying = true;
  gameState.isGameOver = false;
  setOverlay("", "", "", false);
}

function clearObstacles() {
  for (const obstacle of gameState.obstacles) {
    obstacleGroup.remove(obstacle);
  }
  gameState.obstacles = [];
}

function clearParticles() {
  for (const particle of gameState.particles) {
    particlesGroup.remove(particle);
  }
  gameState.particles = [];
}

function restartGame() {
  clearObstacles();
  clearParticles();

  gameState.isPlaying = true;
  gameState.isGameOver = false;
  gameState.score = 0;
  gameState.speed = 8.6;
  gameState.spawnTimer = 1.9;
  gameState.elapsed = 0;

  runner.positionY = world.groundY + 0.92;
  runner.velocityY = 0;
  runner.jumpsUsed = 0;
  runner.onGround = true;
  runner.spinAngle = 0;
  runner.spinVelocity = 0;

  cat.root.position.y = runner.positionY;
  cat.root.rotation.z = 0;
  scoreLabel.textContent = "0";
  setOverlay("", "", "", false);
}

function endGame() {
  gameState.isPlaying = false;
  gameState.isGameOver = true;
  gameState.bestScore = Math.max(gameState.bestScore, Math.floor(gameState.score));
  localStorage.setItem("cat-run-best", String(gameState.bestScore));
  bestScoreLabel.textContent = String(gameState.bestScore);
  setOverlay(
    "까마귀에게 들켰어요",
    `점수 ${Math.floor(gameState.score)}점. 다시 달리려면 버튼이나 점프를 눌러주세요.`,
    "다시 달리기",
    true,
  );
}

function spawnCrow() {
  const crow = createCrow();
  const flightMode = Math.random();
  const lowCrow = flightMode < 0.42;
  const laneY = lowCrow
    ? world.groundY + 0.48
    : flightMode < 0.78
      ? world.groundY + 2.24
      : world.groundY + 3.08;

  crow.position.set(camera.right + 2.2, laneY, 0.6);
  crow.scale.setScalar(lowCrow ? 0.76 + Math.random() * 0.1 : 0.82 + Math.random() * 0.18);
  crow.userData.hitWidth *= crow.scale.x;
  crow.userData.hitHeight *= crow.scale.y;
  obstacleGroup.add(crow);
  gameState.obstacles.push(crow);
}

function updateParticles(delta) {
  for (let i = gameState.particles.length - 1; i >= 0; i -= 1) {
    const particle = gameState.particles[i];
    particle.userData.life -= delta;
    particle.position.x += particle.userData.vx * delta;
    particle.position.y += particle.userData.vy * delta;
    particle.scale.multiplyScalar(0.99);
    particle.material.opacity = Math.max(
      0,
      particle.userData.life / particle.userData.maxLife,
    );

    if (particle.userData.life <= 0) {
      particlesGroup.remove(particle);
      gameState.particles.splice(i, 1);
    }
  }
}

function updateCat(delta) {
  if (gameState.isPlaying) {
    runner.velocityY -= 29 * delta;
    runner.positionY += runner.velocityY * delta;
  }

  const floor = world.groundY + 0.92;
  if (runner.positionY <= floor) {
    runner.positionY = floor;
    runner.velocityY = 0;
    runner.onGround = true;
    runner.jumpsUsed = 0;
    runner.spinVelocity = 0;
    runner.spinAngle = THREE.MathUtils.damp(runner.spinAngle, 0, 12, delta);
  }

  if (!runner.onGround) {
    runner.spinAngle += runner.spinVelocity * delta;
    runner.spinVelocity = Math.max(0, runner.spinVelocity - Math.PI * 4.2 * delta);
  }

  cat.root.position.y = runner.positionY;
  cat.root.rotation.z = runner.spinAngle;

  const bounce = gameState.isPlaying ? Math.sin(gameState.elapsed * 13) : 0;
  const legWave = gameState.isPlaying ? Math.sin(gameState.elapsed * 20) : 0;
  cat.body.scale.y = 1 + Math.abs(bounce) * 0.02;
  cat.head.position.y = 0.72 + Math.max(0, bounce) * 0.07;
  cat.tail.rotation.z = 0.58 + legWave * 0.18;

  cat.paws.forEach((paw, index) => {
    const phase = index % 2 === 0 ? 1 : -1;
    const groundAdjust = runner.onGround ? legWave * 0.11 * phase : 0.06;
    paw.position.y = paw.userData.baseY + groundAdjust;
  });

  const airStretch = THREE.MathUtils.clamp(Math.abs(runner.velocityY) / 16, 0, 0.14);
  cat.root.scale.x = 0.96 + airStretch * 0.2;
  cat.root.scale.y = 0.96 - airStretch * 0.08;

  const shadowScale = THREE.MathUtils.clamp(1.25 - (runner.positionY - floor) * 0.16, 0.6, 1.2);
  cat.shadow.scale.set(shadowScale, 0.45 * shadowScale, 1);
  cat.shadow.material.opacity = THREE.MathUtils.clamp(0.34 - (runner.positionY - floor) * 0.03, 0.08, 0.34);
}

function updateObstacles(delta) {
  if (gameState.isPlaying) {
    gameState.spawnTimer -= delta;
    if (gameState.spawnTimer <= 0) {
      spawnCrow();
      const difficulty = Math.max(0.85, 1.6 - gameState.speed * 0.04);
      gameState.spawnTimer = difficulty + Math.random() * 0.9;
    }
  }

  for (let i = gameState.obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = gameState.obstacles[i];
    if (gameState.isPlaying) {
      obstacle.position.x -= gameState.speed * delta;
    }

    const flap = Math.sin(gameState.elapsed * 18 + obstacle.userData.flapOffset);
    obstacle.userData.wingLeft.rotation.z = 0.3 + flap * 0.38;
    obstacle.userData.wingRight.rotation.z = -0.3 - flap * 0.38;
    obstacle.position.y += Math.sin(gameState.elapsed * 4 + obstacle.userData.bobOffset) * 0.0025;

    if (obstacle.position.x < camera.left - 4) {
      obstacleGroup.remove(obstacle);
      gameState.obstacles.splice(i, 1);
    }
  }
}

function updateGround(delta) {
  if (gameState.isPlaying) {
    sparkleTexture.offset.x -= delta * gameState.speed * 0.015;
  }

  for (const line of groundLines) {
    if (gameState.isPlaying) {
      line.position.x -= gameState.speed * delta;
    }
    if (line.position.x < camera.left - 1.2) {
      line.position.x = camera.right + Math.random() * 1.6;
    }
  }

  for (const cloud of background.cloudGroup.children) {
    if (gameState.isPlaying) {
      cloud.position.x -= cloud.userData.speed * delta * (gameState.speed * 0.42);
    }
    if (cloud.position.x < camera.left - 2.5) {
      cloud.position.x = camera.right + 2 + Math.random() * 3;
      cloud.position.y = 1.5 + Math.random() * 2.6;
    }
  }
}

function intersectsAABB(ax, ay, aw, ah, bx, by, bw, bh) {
  return (
    Math.abs(ax - bx) * 2 < aw + bw &&
    Math.abs(ay - by) * 2 < ah + bh
  );
}

function checkCollisions() {
  if (!gameState.isPlaying) {
    return;
  }

  const catX = cat.root.position.x + 0.18;
  const catY = cat.root.position.y - 0.02;

  for (const obstacle of gameState.obstacles) {
    const hit = intersectsAABB(
      catX,
      catY,
      runner.hitWidth,
      runner.hitHeight,
      obstacle.position.x,
      obstacle.position.y,
      obstacle.userData.hitWidth,
      obstacle.userData.hitHeight,
    );

    if (hit) {
      endGame();
      break;
    }
  }
}

function updateScore(delta) {
  if (!gameState.isPlaying) {
    return;
  }

  gameState.score += delta * 10;
  gameState.speed = Math.min(15.2, 8.6 + gameState.score * 0.028);
  scoreLabel.textContent = String(Math.floor(gameState.score));
}

function step(delta) {
  gameState.elapsed += delta;
  updateGround(delta);
  updateCat(delta);
  updateObstacles(delta);
  updateParticles(delta);
  updateScore(delta);
  checkCollisions();
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.033);
  step(delta);
  renderer.render(scene, camera);
}

function onJumpPress(event) {
  event?.preventDefault();
  triggerJump();
}

window.addEventListener("resize", resizeRenderer);
window.addEventListener("keydown", (event) => {
  if (event.repeat) {
    return;
  }

  if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
    onJumpPress(event);
  }
});

canvas.addEventListener("pointerdown", onJumpPress);
jumpButton.addEventListener("pointerdown", onJumpPress);
actionButton.addEventListener("click", () => {
  if (gameState.isGameOver) {
    restartGame();
    return;
  }
  startGame();
});
restartButton.addEventListener("click", restartGame);

setOverlay(
  "달려라, 말랑 고양이",
  "두 번까지 점프할 수 있어요. 두 번째 점프에서는 빙글 돌며 까마귀를 피해 넘으세요.",
  "시작하기",
  true,
);

resizeRenderer();
animate();
