import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ───────────────────────────────
   DOM 요소 레퍼런스
   ─────────────────────────────── */
const notebook = document.getElementById('notebook');
const notebookToggle = document.getElementById('notebookToggle');
const notebookClose = document.getElementById('notebookClose');
const overlay = document.getElementById('overlay');
const sequenceStatus = document.getElementById('sequenceStatus');
const interactionHint = document.getElementById('interactionHint');
const notebookClueText = document.getElementById('notebookClueText');
const notebookSmellLog = document.getElementById('notebookSmellLog');

/* ───────────────────────────────
   Three.js 기본 세팅
   ─────────────────────────────── */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080808);
scene.fog = new THREE.FogExp2(0x050505, 0.025);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.appendChild(renderer.domElement);

/* ───────────────────────────────
   바닥 (흑백 누아르 느낌)
   ─────────────────────────────── */
const groundGeo = new THREE.PlaneGeometry(200, 200, 100, 100);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.95,
  metalness: 0.05
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 바닥 격자 선 (도시 보도블록 느낌)
const gridHelper = new THREE.GridHelper(200, 80, 0x2a2a2a, 0x1c1c1c);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

/* ───────────────────────────────
   건물 블록 (골목 분위기)
   ─────────────────────────────── */
function createBuildings() {
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.1
  });

  const buildings = [
    { x: -8, z: -5, w: 4, h: 8, d: 6 },
    { x: -8, z: -15, w: 5, h: 12, d: 5 },
    { x: -7, z: -25, w: 3, h: 6, d: 5 },
    { x: -9, z: -35, w: 5, h: 10, d: 8 },
    { x: -7, z: 5, w: 4, h: 7, d: 5 },
    { x: 8, z: -5, w: 4, h: 10, d: 6 },
    { x: 9, z: -18, w: 5, h: 14, d: 7 },
    { x: 7, z: -30, w: 3, h: 9, d: 5 },
    { x: 8, z: 5, w: 4, h: 6, d: 5 },
    { x: 9, z: -42, w: 6, h: 11, d: 6 }
  ];

  buildings.forEach(b => {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const mat = buildingMat.clone();
    mat.color = new THREE.Color(0x111111 + Math.floor(Math.random() * 0x0a0a0a));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(b.x, b.h / 2, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  });

  buildings.forEach(b => {
    const windowCount = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < windowCount; i++) {
      const wGeo = new THREE.PlaneGeometry(0.4, 0.5);
      const wMat = new THREE.MeshStandardMaterial({
        color: 0x332200,
        emissive: 0x443311,
        emissiveIntensity: 0.4 + Math.random() * 0.3,
        side: THREE.DoubleSide
      });
      const win = new THREE.Mesh(wGeo, wMat);
      const faceDir = b.x < 0 ? 1 : -1;
      win.position.set(
        b.x + faceDir * (b.w / 2 + 0.01),
        2 + Math.random() * (b.h - 3),
        b.z + (Math.random() - 0.5) * (b.d - 1)
      );
      win.rotation.y = faceDir * Math.PI / 2;
      scene.add(win);
    }
  });
}

createBuildings();

/* ───────────────────────────────
   강아지 블록 (둥근 큐브 + 눈/코/귀/꼬리 + 다리)
   얼굴 = +Z 방향 (앞쪽)
   ─────────────────────────────── */
const dogGroup = new THREE.Group();

// 몸통 – RoundedBoxGeometry로 부드럽게
const dogGeo = new RoundedBoxGeometry(1, 1, 1, 4, 0.18);
const dogMat = new THREE.MeshStandardMaterial({
  color: 0xdddddd,
  emissive: 0x888888,
  emissiveIntensity: 0.55,
  roughness: 0.5,
  metalness: 0.1
});
const dogBody = new THREE.Mesh(dogGeo, dogMat);
dogBody.castShadow = true;
dogGroup.add(dogBody);

// 왼쪽 눈 (+Z 방향 = 얼굴 앞면)
const eyeGeo = new THREE.SphereGeometry(0.07, 8, 8);
const eyeMat = new THREE.MeshStandardMaterial({
  color: 0x111111,
  emissive: 0x222222,
  emissiveIntensity: 0.4,
  roughness: 0.2
});
const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
leftEye.position.set(-0.2, 0.15, 0.49);
dogGroup.add(leftEye);

// 오른쪽 눈
const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
rightEye.position.set(0.2, 0.15, 0.49);
dogGroup.add(rightEye);

// 눈 반짝이 (하이라이트)
const eyeShineGeo = new THREE.SphereGeometry(0.022, 6, 6);
const eyeShineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0 });
const leftShine = new THREE.Mesh(eyeShineGeo, eyeShineMat);
leftShine.position.set(-0.18, 0.175, 0.555);
dogGroup.add(leftShine);
const rightShine = new THREE.Mesh(eyeShineGeo, eyeShineMat);
rightShine.position.set(0.22, 0.175, 0.555);
dogGroup.add(rightShine);

// 코
const noseGeo = new THREE.SphereGeometry(0.085, 8, 8);
const noseMat = new THREE.MeshStandardMaterial({
  color: 0x111111,
  emissive: 0x330000,
  emissiveIntensity: 0.5,
  roughness: 0.3
});
const nose = new THREE.Mesh(noseGeo, noseMat);
nose.position.set(0, -0.05, 0.51);
dogGroup.add(nose);

// 왼쪽 귀 – RoundedBoxGeometry로 부드럽게
const earGeo = new RoundedBoxGeometry(0.22, 0.38, 0.14, 3, 0.06);
const earMat = new THREE.MeshStandardMaterial({
  color: 0xbbbbbb,
  emissive: 0x666666,
  emissiveIntensity: 0.45,
  roughness: 0.7
});
const leftEar = new THREE.Mesh(earGeo, earMat);
leftEar.position.set(-0.38, 0.62, 0.08);
leftEar.rotation.z = 0.28;
dogGroup.add(leftEar);

// 오른쪽 귀
const rightEar = new THREE.Mesh(earGeo, earMat);
rightEar.position.set(0.38, 0.62, 0.08);
rightEar.rotation.z = -0.28;
dogGroup.add(rightEar);

// 꼬리 (-Z 방향 = 뒤쪽) – 캡슐형으로
const tailGeo = new THREE.CapsuleGeometry(0.06, 0.28, 4, 8);
const tailMat = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  emissive: 0x666666,
  emissiveIntensity: 0.45,
  roughness: 0.6
});
const tail = new THREE.Mesh(tailGeo, tailMat);
tail.position.set(0, 0.25, -0.58);
tail.rotation.x = 0.5;
dogGroup.add(tail);

/* ───────────────────────────────
   초소형 다리 4개 (CapsuleGeometry)
   몸통 크기(1) 기준 0.1 비율 → 반지름 0.055, 높이 0.18
   ─────────────────────────────── */
const legMat = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  emissive: 0x666666,
  emissiveIntensity: 0.45,
  roughness: 0.6
});

function createLeg(xOffset, zOffset) {
  const legGeo = new THREE.CapsuleGeometry(0.055, 0.14, 4, 8);
  const leg = new THREE.Mesh(legGeo, legMat);
  // 몸통 중심(0) 기준 -0.58 → 아랫부분이 몸통 밖으로 완전히 노출
  // 캡슐 총 높이 = 0.14(body) + 0.055*2(반구 x2) = 0.25
  // 몸통 하단 = -0.5 이므로 중심은 -0.5 - 0.125 = -0.625, 살짝 파묻혀 귀엽게
  leg.position.set(xOffset, -0.58, zOffset);
  leg.castShadow = true;
  dogGroup.add(leg);
  return leg;
}

// 앞다리 (z 양수 = 얼굴쪽), 뒷다리 (z 음수 = 꼬리쪽)
const legFL = createLeg(-0.28,  0.28); // 왼쪽 앞
const legFR = createLeg( 0.28,  0.28); // 오른쪽 앞
const legBL = createLeg(-0.28, -0.28); // 왼쪽 뒤
const legBR = createLeg( 0.28, -0.28); // 오른쪽 뒤

// 걷기 애니메이션 타이머
let walkCycle = 0;

// 강아지 위치 초기화
// 다리 하단이 지면(y=0)에 딱 닿도록:
// 다리 중심 -0.58, 캡슐 반구 0.055 → 다리 최하단 = -0.58 - 0.125 = -0.705
// 그룹 Y = 0.705 로 올리면 다리 바닥이 y=0에 닿음
dogGroup.position.set(0, 0.72, 4);
scene.add(dogGroup);

/* ───────────────────────────────
   조명 (낮/밤 전환)
   ─────────────────────────────── */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.12);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x8888cc, 0x333333, 0.25);
hemiLight.position.set(0, 30, 0);
scene.add(hemiLight);

const spotLight = new THREE.SpotLight(0xffeedd, 3, 50, Math.PI / 5, 0.5, 1.5);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);
scene.add(spotLight.target);

const streetLamps = [
  { x: -3, z: -10 },
  { x: 3, z: -20 },
  { x: -3, z: -32 },
  { x: 3, z: 2 }
];

streetLamps.forEach(pos => {
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 4, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(pos.x, 2, pos.z);
  scene.add(pole);

  const lampLight = new THREE.PointLight(0xffcc88, 1.5, 15, 2);
  lampLight.position.set(pos.x, 4.2, pos.z);
  scene.add(lampLight);

  const bulbGeo = new THREE.SphereGeometry(0.15, 8, 8);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffcc88,
    emissive: 0xffcc88,
    emissiveIntensity: 1.0
  });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(pos.x, 4.1, pos.z);
  scene.add(bulb);
});

let timeOfDay = 'night';

function applyLighting() {
  if (timeOfDay === 'day') {
    ambientLight.intensity = 0.7;
    hemiLight.intensity = 0.8;
    spotLight.intensity = 0.0;
    scene.background.set(0x888888);
    scene.fog = new THREE.FogExp2(0x888888, 0.015);
    groundMat.color.set(0x999999);
  } else {
    ambientLight.intensity = 0.12;
    hemiLight.intensity = 0.25;
    spotLight.intensity = 3.0;
    scene.background.set(0x080808);
    scene.fog = new THREE.FogExp2(0x050505, 0.025);
    groundMat.color.set(0x1a1a1a);
  }
}

applyLighting();

/* ───────────────────────────────
   커스텀 마우스 시점 컨트롤 (PointerLock)
   ─────────────────────────────── */
let isPointerLocked = false;
let yaw = Math.PI;
let pitch = 0.3;

const PITCH_MIN = -0.5;
const PITCH_MAX = 1.2;
const MOUSE_SENSITIVITY = 0.002;

document.addEventListener('click', () => {
  if (!isPointerLocked) {
    renderer.domElement.requestPointerLock();
  }
});

document.addEventListener('pointerlockchange', () => {
  isPointerLocked = document.pointerLockElement === renderer.domElement;
});

document.addEventListener('mousemove', (e) => {
  if (!isPointerLocked) return;
  yaw -= e.movementX * MOUSE_SENSITIVITY;
  pitch -= e.movementY * MOUSE_SENSITIVITY;
  pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
});

/* ───────────────────────────────
   WASD 이동
   ─────────────────────────────── */
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false
};

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW': moveState.forward = true; break;
    case 'KeyS': moveState.backward = true; break;
    case 'KeyA': moveState.left = true; break;
    case 'KeyD': moveState.right = true; break;
    case 'KeyT':
      timeOfDay = timeOfDay === 'night' ? 'day' : 'night';
      applyLighting();
      break;
    case 'KeyE':
      handleInteract();
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW': moveState.forward = false; break;
    case 'KeyS': moveState.backward = false; break;
    case 'KeyA': moveState.left = false; break;
    case 'KeyD': moveState.right = false; break;
  }
});

/* ───────────────────────────────
   단서 상자
   ─────────────────────────────── */
const raycaster = new THREE.Raycaster();
const interactableObjects = [];
let lookingAtClue = false;
let clueInvestigated = false;

const clueBoxGeo = new THREE.BoxGeometry(1, 1, 1);
const clueBoxMat = new THREE.MeshStandardMaterial({
  color: 0x1a0000,
  emissive: 0xcc0000,
  emissiveIntensity: 0.6,
  roughness: 0.5,
  metalness: 0.2
});
const clueBox = new THREE.Mesh(clueBoxGeo, clueBoxMat);
clueBox.position.set(0, 0.5, -26);
clueBox.castShadow = true;
scene.add(clueBox);
interactableObjects.push(clueBox);

const clueRingGeo = new THREE.TorusGeometry(1.0, 0.04, 8, 32);
const clueRingMat = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  emissive: 0xff0000,
  emissiveIntensity: 0.8,
  transparent: true,
  opacity: 0.6
});
const clueRing = new THREE.Mesh(clueRingGeo, clueRingMat);
clueRing.position.set(0, 0.5, -26);
clueRing.rotation.x = Math.PI / 2;
scene.add(clueRing);

/* ───────────────────────────────
   냄새 수집 파티클 폭발 시스템
   ─────────────────────────────── */
const activeParticles = []; // { mesh, velocity, life, maxLife }

function spawnSmellBurst(position, color) {
  const particleCount = 24;
  for (let i = 0; i < particleCount; i++) {
    const geo = new THREE.SphereGeometry(0.06, 6, 6);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 1.0
    });
    const p = new THREE.Mesh(geo, mat);
    p.position.copy(position);

    // 방사형 랜덤 속도
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 3.0,
      Math.random() * 2.5 + 0.5,
      (Math.random() - 0.5) * 3.0
    );

    scene.add(p);
    activeParticles.push({
      mesh: p,
      velocity,
      life: 2.0,  // 2초
      maxLife: 2.0
    });
  }
}

function updateParticles(delta) {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.life -= delta;

    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      activeParticles.splice(i, 1);
      continue;
    }

    // 물리: 중력 + 감속
    p.velocity.y -= 2.0 * delta;
    p.velocity.multiplyScalar(1 - 1.5 * delta);

    p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));

    // 투명도: 2초에 걸쳐 서서히 사라짐
    const t = p.life / p.maxLife;
    p.mesh.material.opacity = t;

    // 크기: 처음에 커졌다가 줄어듦
    const scaleCurve = t < 0.7 ? 1.0 + (1.0 - t / 0.7) * 0.8 : t * 1.5;
    p.mesh.scale.setScalar(scaleCurve);
  }
}

/* ───────────────────────────────
   냄새 추적 경로 (네온 파티클)
   ─────────────────────────────── */
const smellMarkers = [];
const smellGoal = new THREE.Vector3(0, 0.1, -26);
const SMELL_COLLECT_DIST = 1.8; // 강아지가 이 거리 안에 들어오면 냄새 수집

// 냄새 종류 데이터
const smellTypes = [
  { name: '피 냄새', desc: '철분이 섞인 선명한 핏냄새. 피해자의 것으로 추정된다.' },
  { name: '약품 냄새', desc: '클로로포름 계열의 자극적인 약품 냄새가 난다.' },
  { name: '향수 냄새', desc: '고급 장미향 향수. 피해자가 즐겨 사용하던 것이다.' },
  { name: '동물 체취', desc: '낯선 동물의 털과 체취. 용의자의 반려동물일 가능성.' },
  { name: '흙 냄새', desc: '축축한 흙과 낙엽 냄새. 범행 장소 근처의 공원 토양과 일치.' },
  { name: '담배 연기', desc: '값싼 담배 연기 냄새. 용의자의 흡연 습관과 연결된다.' },
  { name: '기름 냄새', desc: '엔진 오일 냄새. 차량으로 도주했을 가능성을 시사한다.' },
];

let collectedSmellCount = 0;

function createSmellPath() {
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x =
      THREE.MathUtils.lerp(0, smellGoal.x, t) +
      Math.sin(t * Math.PI * 3) * 1.2;
    const z = THREE.MathUtils.lerp(4, smellGoal.z, t);
    const color = i % 2 === 0 ? 0xff00ff : 0x00ff88;

    const geo = new THREE.SphereGeometry(0.15, 12, 12);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85
    });
    const marker = new THREE.Mesh(geo, mat);
    marker.position.set(x, 0.18, z);
    marker.userData.isSmell = true;
    marker.userData.baseX = x;
    marker.userData.collected = false;
    marker.userData.dying = false;
    marker.userData.color = color;
    marker.userData.smellType = smellTypes[i % smellTypes.length];
    smellMarkers.push(marker);
    scene.add(marker);

    if (i % 4 === 0) {
      const light = new THREE.PointLight(color, 0.6, 4, 2);
      light.position.set(x, 0.5, z);
      marker.userData.light = light;
      scene.add(light);
    }
  }
}

createSmellPath();

// 냄새 수집 로직
function checkSmellCollection() {
  smellMarkers.forEach((marker) => {
    if (marker.userData.collected) return;
    const dist = dogGroup.position.distanceTo(marker.position);
    if (dist < SMELL_COLLECT_DIST) {
      marker.userData.collected = true;
      collectedSmellCount++;

      // 파티클 폭발 생성
      spawnSmellBurst(marker.position.clone(), marker.userData.color);

      // 마커 즉시 제거
      scene.remove(marker);
      if (marker.userData.light) scene.remove(marker.userData.light);

      // 수첩에 냄새 기록 추가
      addSmellToNotebook(marker.userData.smellType, marker.userData.color);

      // 시퀀스 상태 업데이트
      if (sequenceStatus) {
        const remaining = smellMarkers.filter(m => !m.userData.collected).length;
        if (remaining > 0) {
          sequenceStatus.textContent = `냄새 수집 중... (${collectedSmellCount}개 수집, ${remaining}개 남음)`;
        } else {
          sequenceStatus.textContent = '모든 냄새를 수집했다! 붉게 빛나는 상자에 접근해 E 키로 조사하세요.';
        }
      }
    }
  });
}

/* ───────────────────────────────
   수첩에 냄새 기록 + 강아지 얼굴 도장
   ─────────────────────────────── */
function addSmellToNotebook(smellType, color) {
  if (!notebookSmellLog) return;

  // 첫 수집 시 빈 상태 메시지 제거
  const emptyMsg = notebookSmellLog.querySelector('.smell-log-empty');
  if (emptyMsg) emptyMsg.remove();

  const entry = document.createElement('div');
  entry.className = 'smell-entry smell-entry-new';

  // CSS 색상 문자열
  const cssColor = '#' + new THREE.Color(color).getHexString();

  entry.innerHTML = `
    <div class="smell-entry-header">
      <span class="smell-stamp" style="border-color: ${cssColor};">
        <span class="stamp-face">
          <span class="stamp-eye">●</span>
          <span class="stamp-nose">▼</span>
          <span class="stamp-eye">●</span>
        </span>
      </span>
      <span class="smell-name" style="color: ${cssColor};">${smellType.name}</span>
      <span class="smell-number">#${String(collectedSmellCount).padStart(2, '0')}</span>
    </div>
    <p class="smell-desc">${smellType.desc}</p>
  `;

  notebookSmellLog.appendChild(entry);

  // 새 항목 등장 애니메이션 트리거
  requestAnimationFrame(() => {
    entry.classList.remove('smell-entry-new');
  });
}

/* ───────────────────────────────
   추리 수첩 UI
   ─────────────────────────────── */
function openNotebook() {
  if (!notebook || !overlay) return;
  notebook.classList.remove('hidden');
  notebook.classList.add('open');
  overlay.classList.remove('hidden');
  overlay.classList.add('visible');
}

function closeNotebook() {
  if (!notebook || !overlay) return;
  notebook.classList.remove('open');
  notebook.classList.add('hidden');
  overlay.classList.remove('visible');
  overlay.classList.add('hidden');
}

if (notebookToggle) {
  notebookToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (notebook.classList.contains('hidden')) {
      openNotebook();
    } else {
      closeNotebook();
    }
  });
}

if (notebookClose) {
  notebookClose.addEventListener('click', (event) => {
    event.stopPropagation();
    closeNotebook();
  });
}

if (overlay) {
  overlay.addEventListener('click', () => {
    closeNotebook();
  });
}

function handleInteract() {
  if (!lookingAtClue || clueInvestigated) return;
  clueInvestigated = true;
  if (notebookClueText) {
    notebookClueText.textContent =
      '첫 단서 상자 내부에서 피해자의 향수 냄새와 낯선 동물 털이 함께 발견되었다.';
  }
  openNotebook();
}

/* ───────────────────────────────
   애니메이션 루프
   ─────────────────────────────── */
const clock = new THREE.Clock();

const CAM_DISTANCE = 4.0;
const CAM_HEIGHT = 2.5;
const CAM_LERP = 0.08;
const MOVE_SPEED = 5.0;

camera.position.set(0, CAM_HEIGHT + 0.5, 4 + CAM_DISTANCE);

function animate() {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  /* ─── 강아지 이동 (WASD) ─── */
  if (isPointerLocked) {
    // "forward" = 카메라가 바라보는 방향 (yaw 기준, -Z 월드 방향에서 회전)
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(-Math.sin(yaw - Math.PI / 2), 0, -Math.cos(yaw - Math.PI / 2));

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (moveState.forward) moveDir.add(forward);
    if (moveState.backward) moveDir.sub(forward);
    if (moveState.left) moveDir.sub(right);
    if (moveState.right) moveDir.add(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize().multiplyScalar(MOVE_SPEED * delta);
      dogGroup.position.add(moveDir);

      // 강아지가 이동 방향을 바라보도록 회전
      // +Z 로컬이 얼굴 방향이므로 atan2로 계산한 각도를 그대로 사용
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      dogGroup.rotation.y = targetAngle;
    }
  }

  dogGroup.position.y = 0.72;

  /* ─── 꼬리 흔들기 ─── */
  tail.rotation.y = Math.sin(elapsed * 6) * 0.4;

  /* ─── 다리 걷기 애니메이션 ─── */
  const isMoving = isPointerLocked && (
    moveState.forward || moveState.backward ||
    moveState.left    || moveState.right
  );

  if (isMoving) {
    // 이동 중: 빠른 총총걸음 (8Hz)
    walkCycle += delta * 8;
    const swing  = 0.55; // 최대 회전 각도(rad)
    // 대각선 대칭 패턴 (FL↔BR, FR↔BL)
    legFL.rotation.x =  Math.sin(walkCycle)          * swing;
    legBR.rotation.x =  Math.sin(walkCycle)          * swing;
    legFR.rotation.x =  Math.sin(walkCycle + Math.PI) * swing;
    legBL.rotation.x =  Math.sin(walkCycle + Math.PI) * swing;
  } else {
    // 대기 중: 다리가 원위치(0)로 부드럽게 복귀
    const returnSpeed = 1 - Math.pow(0.05, delta); // 지수 보간
    legFL.rotation.x *= (1 - returnSpeed);
    legFR.rotation.x *= (1 - returnSpeed);
    legBL.rotation.x *= (1 - returnSpeed);
    legBR.rotation.x *= (1 - returnSpeed);
  }

  /* ─── 3인칭 숄더뷰 카메라 ─── */
  const idealOffset = new THREE.Vector3(
    Math.sin(yaw) * CAM_DISTANCE,
    CAM_HEIGHT,
    Math.cos(yaw) * CAM_DISTANCE
  );
  const idealPos = dogGroup.position.clone().add(idealOffset);
  camera.position.lerp(idealPos, CAM_LERP);

  const lookTarget = new THREE.Vector3(
    dogGroup.position.x,
    dogGroup.position.y + 0.5,
    dogGroup.position.z
  );
  const lookOffset = new THREE.Vector3(
    -Math.sin(yaw) * 2,
    -pitch * 2,
    -Math.cos(yaw) * 2
  );
  const finalLookTarget = lookTarget.clone().add(lookOffset);
  camera.lookAt(finalLookTarget);

  /* ─── 야간 플래시라이트 ─── */
  if (timeOfDay === 'night') {
    spotLight.position.copy(dogGroup.position);
    spotLight.position.y += 2;
    const lightDir = new THREE.Vector3(-Math.sin(yaw), -0.3, -Math.cos(yaw));
    spotLight.target.position.copy(dogGroup.position).add(lightDir.multiplyScalar(10));
  }

  /* ─── 냄새 수집 체크 ─── */
  checkSmellCollection();

  /* ─── 수집 파티클 업데이트 ─── */
  updateParticles(delta);

  /* ─── 남아있는 냄새 경로 맥동 애니메이션 ─── */
  smellMarkers.forEach((marker, index) => {
    if (marker.userData.collected) return;
    marker.position.y = 0.18 + Math.sin(elapsed * 2.5 + index * 0.5) * 0.1;
    marker.position.x = marker.userData.baseX + Math.sin(elapsed * 1.5 + index * 0.7) * 0.05;
    const scale = 1.0 + Math.sin(elapsed * 3 + index * 0.6) * 0.2;
    marker.scale.setScalar(scale);
    if (marker.userData.light) {
      marker.userData.light.intensity = 0.4 + Math.sin(elapsed * 2 + index) * 0.3;
      marker.userData.light.position.y = marker.position.y + 0.3;
    }
  });

  /* ─── 단서 상자 회전 & 링 맥동 ─── */
  clueBox.rotation.y = elapsed * 0.5;
  clueRing.rotation.z = elapsed * 0.8;
  const ringScale = 1.0 + Math.sin(elapsed * 2) * 0.15;
  clueRing.scale.setScalar(ringScale);

  /* ─── 레이캐스트: 단서 상자 주시 확인 ─── */
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const intersects = raycaster.intersectObjects(interactableObjects, false);
  lookingAtClue = intersects.length > 0;
  if (interactionHint) {
    interactionHint.classList.toggle('hidden', !lookingAtClue);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

/* ───────────────────────────────
   리사이즈 대응
   ─────────────────────────────── */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
