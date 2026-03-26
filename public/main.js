import * as THREE from 'three';

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
   강아지 (포메라니안 찐빵 체형)
   얼굴 = +Z 방향 (앞쪽)
   ─────────────────────────────── */
const dogGroup = new THREE.Group();

// ── 공통 머티리얼 정의 ──
const furMainMat = new THREE.MeshStandardMaterial({
  color: 0xF5DEB3,   // 밝은 크림/wheat
  roughness: 0.85,
  metalness: 0.0
});
const furDarkMat = new THREE.MeshStandardMaterial({
  color: 0xD2B48C,   // 연한 갈색 tan
  roughness: 0.85,
  metalness: 0.0
});
const eyeMat = new THREE.MeshStandardMaterial({
  color: 0x000000,
  roughness: 0.1,
  metalness: 0.15
});
const noseMat = new THREE.MeshStandardMaterial({
  color: 0x000000,
  roughness: 0.15,
  metalness: 0.1
});
const tongueMat = new THREE.MeshStandardMaterial({
  color: 0xFF69B4,   // hot pink
  roughness: 0.6,
  metalness: 0.0,
  side: THREE.DoubleSide
});

// ══════════════════════════════
//  몸통 — Y축 그라데이션 ShaderMaterial
// ══════════════════════════════
const bodyGradMat = new THREE.ShaderMaterial({
  uniforms: {
    colorTop:    { value: new THREE.Color(0xD2B48C) }, // 갈색 (등)
    colorBottom: { value: new THREE.Color(0xFFFDD0) }, // 크림 (배/가슴)
  },
  vertexShader: `
    varying float vY;
    void main() {
      // 로컬 Y를 그대로 전달 (scale로 눌렸어도 법선 기반보다 Y가 직관적)
      vY = position.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 colorTop;
    uniform vec3 colorBottom;
    varying float vY;
    void main() {
      // body radius=0.55, t=0(하단)~1(상단)
      float t = clamp(vY / 0.55 * 0.5 + 0.5, 0.0, 1.0);
      gl_FragColor = vec4(mix(colorBottom, colorTop, t), 1.0);
    }
  `
});

const bodyGeo = new THREE.SphereGeometry(0.55, 24, 18);
const dogBody = new THREE.Mesh(bodyGeo, bodyGradMat);
dogBody.scale.set(1.22, 0.82, 1.30);
dogBody.position.set(0, 0, 0);
dogBody.castShadow = true;
dogGroup.add(dogBody);

// ══════════════════════════════
//  머리 — 목 없이 몸통 앞 상단에 밀착
// ══════════════════════════════
const headGroup = new THREE.Group();

// 머리도 동일 그라데이션 셰이더 (가슴-얼굴 색상 자연스럽게 이어지도록)
const headGradMat = new THREE.ShaderMaterial({
  uniforms: {
    colorTop:    { value: new THREE.Color(0xD2B48C) },
    colorBottom: { value: new THREE.Color(0xFFFDD0) },
  },
  vertexShader: `
    varying float vY;
    void main() {
      vY = position.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 colorTop;
    uniform vec3 colorBottom;
    varying float vY;
    void main() {
      float t = clamp(vY / 0.42 * 0.5 + 0.5, 0.0, 1.0);
      gl_FragColor = vec4(mix(colorBottom, colorTop, t), 1.0);
    }
  `
});

const headGeo = new THREE.SphereGeometry(0.42, 20, 16);
const head = new THREE.Mesh(headGeo, headGradMat);
head.scale.set(1.05, 1.0, 1.0);
head.castShadow = true;
headGroup.add(head);

// ── 귀 — CapsuleGeometry 뾰족한 개 귀 / 정면 가시성 극대화 ──
const earGeo = new THREE.CapsuleGeometry(0.085, 0.26, 6, 10);
const leftEar = new THREE.Mesh(earGeo, furDarkMat);
// 납작하게 + 정면을 향하도록 회전, X간격 중앙으로 좌힘
leftEar.scale.set(0.60, 1.0, 0.45);
leftEar.position.set(-0.26, 0.44, 0.06);  // 주둥이에 가깝게, 앞쪽으로
leftEar.rotation.z =  0.18;   // 가이 약하게 바깥
leftEar.rotation.y =  0.10;   // 정면에서 잘 보이도록 앞으로
leftEar.rotation.x = -0.05;
headGroup.add(leftEar);

const rightEar = new THREE.Mesh(earGeo, furDarkMat);
rightEar.scale.set(0.60, 1.0, 0.45);
rightEar.position.set( 0.26, 0.44, 0.06);
rightEar.rotation.z = -0.18;
rightEar.rotation.y = -0.10;
rightEar.rotation.x = -0.05;
headGroup.add(rightEar);

// ── 눈 ──
const eyeGeo = new THREE.SphereGeometry(0.075, 14, 12);
const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
leftEye.position.set(-0.18, 0.08, 0.36);
headGroup.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
rightEye.position.set( 0.18, 0.08, 0.36);
headGroup.add(rightEye);

// 눈 하이라이트
const eyeShineGeo = new THREE.SphereGeometry(0.022, 8, 8);
const eyeShineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0 });
const leftShine  = new THREE.Mesh(eyeShineGeo, eyeShineMat);
leftShine.position.set(-0.165, 0.10, 0.43);
headGroup.add(leftShine);
const rightShine = new THREE.Mesh(eyeShineGeo, eyeShineMat);
rightShine.position.set( 0.195, 0.10, 0.43);
headGroup.add(rightShine);

// ── 주둥이 (납작한 원기둥 + 코) ──
const snoutGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.10, 16);
const snoutMat = new THREE.MeshStandardMaterial({ color: 0xF0D0A0, roughness: 0.8 });
const snout = new THREE.Mesh(snoutGeo, snoutMat);
snout.rotation.x = Math.PI / 2;
snout.position.set(0, -0.07, 0.40);
headGroup.add(snout);

const noseGeo = new THREE.SphereGeometry(0.065, 12, 10);
const nose = new THREE.Mesh(noseGeo, noseMat);
nose.scale.set(1.2, 0.75, 0.9);
nose.position.set(0, -0.05, 0.48);
headGroup.add(nose);

// ── 혀 (분홍 납작 반구 — 주둥이 아래로 쏙) ──
const tongueGeo = new THREE.SphereGeometry(0.075, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
const tongue = new THREE.Mesh(tongueGeo, tongueMat);
tongue.rotation.x = Math.PI * 0.6;
tongue.position.set(0, -0.14, 0.42);
headGroup.add(tongue);

// 머리를 몸통 앞 상단에 밀착 배치 (목 없음)
headGroup.position.set(0, 0.46, 0.30);
headGroup.rotation.x = -0.12;  // 약간 앞으로 숙인 느낌
dogGroup.add(headGroup);

// ══════════════════════════════
//  꼬리 — 위로 동그랗게 말린 털북숭이
// ══════════════════════════════
const tailGroup = new THREE.Group();
tailGroup.position.set(0, 0.18, -0.62);
dogGroup.add(tailGroup);

const tailFurMat = new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.9, metalness: 0.0 });

// 꼬리 기둥 구들 — 위로 말리는 호(arc) 형태로 배열
const tailCurve = [
  { r: 0.12, x: 0,     y: 0.00, z: 0.00 },
  { r: 0.115,x:-0.04,  y: 0.12, z: 0.04 },
  { r: 0.11, x:-0.07,  y: 0.22, z: 0.10 },
  { r: 0.10, x:-0.05,  y: 0.30, z: 0.16 },
  { r: 0.09, x: 0.00,  y: 0.34, z: 0.18 },
  { r: 0.085,x: 0.05,  y: 0.32, z: 0.14 },
  { r: 0.08, x: 0.07,  y: 0.26, z: 0.08 },
];
tailCurve.forEach(t => {
  const tg = new THREE.SphereGeometry(t.r, 10, 8);
  const tm = new THREE.Mesh(tg, tailFurMat);
  tm.position.set(t.x, t.y, t.z);
  tm.castShadow = true;
  tailGroup.add(tm);
});

// 꼬리 끝 토러스 (말린 느낌 보강)
const tailRingGeo = new THREE.TorusGeometry(0.09, 0.055, 8, 18, Math.PI * 1.3);
const tailRing = new THREE.Mesh(tailRingGeo, tailFurMat);
tailRing.position.set(0.04, 0.35, 0.13);
tailRing.rotation.z = -Math.PI * 0.4;
tailRing.rotation.x = Math.PI * 0.3;
tailGroup.add(tailRing);

// ══════════════════════════════
//  다리 4개 — 짧고 앙증맞게 몸통 안쪽
// ══════════════════════════════
const legMat = new THREE.MeshStandardMaterial({
  color: 0xC8A878,
  roughness: 0.85,
  metalness: 0.0
});

function createLeg(xOffset, zOffset) {
  const legGeo = new THREE.CapsuleGeometry(0.072, 0.16, 6, 10);
  const leg = new THREE.Mesh(legGeo, legMat);
  // 몸통을 Y=0.82 스케일로 눌렀으므로 다리는 몸통 바닥(~-0.45) 바로 아래
  leg.position.set(xOffset, -0.38, zOffset);
  leg.castShadow = true;
  dogGroup.add(leg);
  return leg;
}

// 찐빵 몸통 폭에 맞춰 다리 간격 조정
const legFL = createLeg(-0.32,  0.30);
const legFR = createLeg( 0.32,  0.30);
const legBL = createLeg(-0.32, -0.28);
const legBR = createLeg( 0.32, -0.28);

// ══════════════════════════════
//  탐정 모자 (디어스토커) — 갈색 반구 + 챙
// ══════════════════════════════
const hatGroup = new THREE.Group();
const hatMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, metalness: 0.0 });

// 돔 (반구형 상단)
const hatDomeGeo = new THREE.SphereGeometry(0.36, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52);
const hatDome = new THREE.Mesh(hatDomeGeo, hatMat);
hatDome.scale.set(1.0, 1.15, 0.90);
hatDome.castShadow = true;
hatGroup.add(hatDome);

// 챙 앞
const brimFGeo = new THREE.CylinderGeometry(0.30, 0.30, 0.04, 20);
const brimFront = new THREE.Mesh(brimFGeo, hatMat);
brimFront.position.set(0, -0.04, 0.20);
brimFront.rotation.x =  0.35;
brimFront.scale.set(0.90, 1.0, 0.52);
hatGroup.add(brimFront);

// 챙 뒤
const brimBGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 20);
const brimBack = new THREE.Mesh(brimBGeo, hatMat);
brimBack.position.set(0, -0.04, -0.20);
brimBack.rotation.x = -0.35;
brimBack.scale.set(0.90, 1.0, 0.52);
hatGroup.add(brimBack);

// 밴드 (테두리 어두운 띠)
const hatBandGeo = new THREE.TorusGeometry(0.32, 0.030, 8, 32);
const hatBandMat = new THREE.MeshStandardMaterial({ color: 0x3B1A00, roughness: 0.7 });
const hatBand = new THREE.Mesh(hatBandGeo, hatBandMat);
hatBand.scale.set(1.0, 1.0, 0.90);
hatBand.position.set(0, -0.01, 0);
hatGroup.add(hatBand);

// 뼈다귀 텍스처 패치 (Canvas)
const bCv = document.createElement('canvas');
bCv.width = 128; bCv.height = 64;
const bCx = bCv.getContext('2d');
bCx.fillStyle = '#8B4513'; bCx.fillRect(0, 0, 128, 64);
bCx.fillStyle = 'rgba(255,255,255,0.88)';
function drawBone(cx, cy, s) {
  [[-s, 0], [s, 0]].forEach(([dx]) => {
    bCx.beginPath(); bCx.arc(cx + dx, cy, s * 0.55, 0, Math.PI * 2); bCx.fill();
    bCx.beginPath(); bCx.arc(cx + dx, cy - s * 0.3, s * 0.38, 0, Math.PI * 2); bCx.fill();
    bCx.beginPath(); bCx.arc(cx + dx, cy + s * 0.3, s * 0.38, 0, Math.PI * 2); bCx.fill();
  });
  bCx.fillRect(cx - s, cy - s * 0.18, s * 2, s * 0.36);
}
drawBone(64, 32, 7);
const boneTex = new THREE.CanvasTexture(bCv);
const bPatch = new THREE.Mesh(
  new THREE.PlaneGeometry(0.26, 0.13),
  new THREE.MeshStandardMaterial({ map: boneTex, transparent: true,
    polygonOffset: true, polygonOffsetFactor: -1 })
);
bPatch.position.set(0, 0.08, 0.33);
hatGroup.add(bPatch);

// ── 모자 전체 축소 후 두 귀 사이 머리 위에 안착 ──
hatGroup.scale.set(0.65, 0.65, 0.65);
hatGroup.position.set(0, 0.42, -0.01);
hatGroup.rotation.x =  0.10;
hatGroup.rotation.z = -0.05;
headGroup.add(hatGroup);

// 걷기 애니메이션 타이머
let walkCycle = 0;

// ─── 강아지 그룹 지면 배치 ───
// 다리 중심 -0.38, 캡슐 반구 ≈ 0.19 → 최하단 ≈ -0.57
// 그룹 Y = 0.60 으로 올리면 다리 바닥이 y≈0 에 닿음
dogGroup.position.set(0, 0.60, 4);
scene.add(dogGroup);





/* ───────────────────────────────
   조명 (낮/밤 전환)
   ─────────────────────────────── */

// ── 공통 조명 ──
const ambientLight = new THREE.AmbientLight(0xffffff, 0.12);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x8888cc, 0x333333, 0.25);
hemiLight.position.set(0, 30, 0);
scene.add(hemiLight);

// ── 야간 손전등 (SpotLight) ──
const spotLight = new THREE.SpotLight(0xffeedd, 3, 50, Math.PI / 5, 0.5, 1.5);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);
scene.add(spotLight.target);

// ── 낮 태양광 (DirectionalLight) ──
const sunLight = new THREE.DirectionalLight(0xFFFACD, 2.2);
sunLight.position.set(30, 60, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 200;
sunLight.shadow.camera.left = -60;
sunLight.shadow.camera.right = 60;
sunLight.shadow.camera.top = 60;
sunLight.shadow.camera.bottom = -60;
scene.add(sunLight);

// ── 밤 달빛 (DirectionalLight) ──
const moonLight = new THREE.DirectionalLight(0x4169E1, 0.45);
moonLight.position.set(-20, 50, -10);
scene.add(moonLight);

// 가로등
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

/* ───────────────────────────────
   하늘 요소 (정적 Canvas 텍스처 기반)
   ─────────────────────────────── */

// ── 헬퍼: Canvas 텍스처 생성 ──
function makeCanvasTex(w, h, drawFn) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  drawFn(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = false; // 정적 — 업데이트 불필요
  return tex;
}

// ── 낮 하늘 돔 텍스처 (#87CEEB 그라데이션) ──
const daySkyCv = makeCanvasTex(512, 512, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, '#2a6fa8');
  g.addColorStop(0.5, '#87CEEB');
  g.addColorStop(1.0, '#c9e8f5');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
});

// ── 밤 하늘 돔 텍스처 (남색↔보라 그라데이션) ──
const nightSkyCv = makeCanvasTex(512, 512, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, '#000033');
  g.addColorStop(0.4, '#000080');
  g.addColorStop(0.8, '#1a0050');
  g.addColorStop(1.0, '#120030');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
});

// ── 하늘 돔 메시 (안쪽 면 렌더링) ──
const skyDomeGeo = new THREE.SphereGeometry(400, 32, 16);
const skyDomeMat = new THREE.MeshBasicMaterial({
  map: nightSkyCv,
  side: THREE.BackSide,
  depthWrite: false
});
const skyDome = new THREE.Mesh(skyDomeGeo, skyDomeMat);
scene.add(skyDome);

// ── 달 텍스처 + 메시 ──
const moonTex = makeCanvasTex(256, 256, (ctx, w, h) => {
  // 달 배경 (투명)
  ctx.clearRect(0, 0, w, h);
  // 달 원
  const grd = ctx.createRadialGradient(w*0.45, h*0.42, w*0.02, w*0.5, h*0.5, w*0.46);
  grd.addColorStop(0.0, '#fffff0');
  grd.addColorStop(0.6, '#f0e8c0');
  grd.addColorStop(1.0, '#c8b860');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(w/2, h/2, w*0.44, 0, Math.PI*2);
  ctx.fill();
  // 달 표면 크레이터
  ctx.fillStyle = 'rgba(180,160,80,0.25)';
  [[0.35,0.40,0.07],[0.60,0.55,0.05],[0.45,0.65,0.04]].forEach(([cx,cy,r]) => {
    ctx.beginPath(); ctx.arc(w*cx, h*cy, w*r, 0, Math.PI*2); ctx.fill();
  });
});
const moonGeo = new THREE.PlaneGeometry(22, 22);
const moonMat = new THREE.MeshBasicMaterial({
  map: moonTex, transparent: true, depthWrite: false, side: THREE.DoubleSide
});
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
moonMesh.position.set(120, 160, -300);
moonMesh.lookAt(0, 0, 0);
scene.add(moonMesh);

// ── 별 텍스처 + 메시 (정적 스프라이트 시트) ──
const starsTex = makeCanvasTex(1024, 1024, (ctx, w, h) => {
  ctx.fillStyle = 'transparent';
  ctx.clearRect(0, 0, w, h);
  const rng = (n) => Math.floor(Math.random() * n);
  for (let i = 0; i < 320; i++) {
    const x = rng(w), y = rng(h);
    const r = Math.random() * 1.8 + 0.4;
    const bright = Math.floor(Math.random() * 55 + 200);
    ctx.fillStyle = `rgba(${bright},${bright},${Math.min(255,bright+30)},${0.6 + Math.random()*0.4})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  }
});
const starsGeo = new THREE.SphereGeometry(380, 32, 16);
const starsMat = new THREE.MeshBasicMaterial({
  map: starsTex, side: THREE.BackSide, transparent: true, depthWrite: false
});
const starsMesh = new THREE.Mesh(starsGeo, starsMat);
scene.add(starsMesh);

// ── 구름 텍스처 생성 헬퍼 ──
function makeCloudTex() {
  return makeCanvasTex(256, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const puffs = [[w*0.25, h*0.55, 36],[w*0.45, h*0.40, 48],[w*0.65, h*0.50, 38],[w*0.80, h*0.58, 28]];
    puffs.forEach(([cx,cy,r]) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0.0, 'rgba(255,255,255,0.92)');
      g.addColorStop(0.6, 'rgba(240,245,255,0.60)');
      g.addColorStop(1.0, 'rgba(220,230,255,0.00)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    });
  });
}

// ── 낮 구름 Billboard 배치 ──
const cloudPositions = [
  [-60, 90, -180], [40, 80, -200], [-20, 110, -150],
  [80, 95, -170], [-100, 85, -130]
];
const cloudMeshes = cloudPositions.map(([x,y,z]) => {
  const geo = new THREE.PlaneGeometry(60, 28);
  const mat = new THREE.MeshBasicMaterial({
    map: makeCloudTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.lookAt(0, y, 0);
  scene.add(m);
  return m;
});

/* ───────────────────────────────
   낮/밤 전환
   ─────────────────────────────── */
let timeOfDay = 'night';

function applyLighting() {
  if (timeOfDay === 'day') {
    // 하늘 돔 — 낮
    skyDomeMat.map = daySkyCv;
    skyDomeMat.needsUpdate = true;
    scene.background = null;           // 돔이 배경 담당
    scene.fog = new THREE.FogExp2(0xc9e8f5, 0.008);

    // 조명
    ambientLight.color.set(0xfff5e0);
    ambientLight.intensity = 0.9;
    hemiLight.color.set(0x87CEEB);
    hemiLight.groundColor.set(0x8B7355);
    hemiLight.intensity = 1.0;
    sunLight.intensity = 2.2;
    moonLight.intensity = 0.0;
    spotLight.intensity = 0.0;

    // 지면 색
    groundMat.color.set(0x888870);

    // 하늘 요소 가시성
    moonMesh.visible = false;
    starsMesh.visible = false;
    cloudMeshes.forEach(c => { c.visible = true; });

  } else {
    // 하늘 돔 — 밤
    skyDomeMat.map = nightSkyCv;
    skyDomeMat.needsUpdate = true;
    scene.background = null;
    scene.fog = new THREE.FogExp2(0x05050f, 0.022);

    // 조명
    ambientLight.color.set(0x4169E1);
    ambientLight.intensity = 0.22;
    hemiLight.color.set(0x223355);
    hemiLight.groundColor.set(0x111122);
    hemiLight.intensity = 0.28;
    sunLight.intensity = 0.0;
    moonLight.intensity = 0.45;
    spotLight.intensity = 2.8;

    // 지면 색
    groundMat.color.set(0x1a1a1a);

    // 하늘 요소 가시성
    moonMesh.visible = true;
    starsMesh.visible = true;
    cloudMeshes.forEach(c => { c.visible = false; });
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
const SMELL_COLLECT_DIST_SQ = SMELL_COLLECT_DIST * SMELL_COLLECT_DIST; // distanceToSquared용 제곱값

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
  // 뒤에서 앞으로 순회해야 splice 시 인덱스 오류 없음
  for (let i = smellMarkers.length - 1; i >= 0; i--) {
    const marker = smellMarkers[i];

    // [최적화 1] distanceToSquared — sqrt 연산 없이 가벼운 거리 비교
    const distSq = dogGroup.position.distanceToSquared(marker.position);
    if (distSq < SMELL_COLLECT_DIST_SQ) {
      collectedSmellCount++;

      // 파티클 폭발 생성
      spawnSmellBurst(marker.position.clone(), marker.userData.color);

      // [최적화 2] geometry & material 메모리 완전 해제 후 씬에서 제거
      scene.remove(marker);
      marker.geometry.dispose();
      marker.material.dispose();
      if (marker.userData.light) scene.remove(marker.userData.light);

      // [최적화 3] 배열에서 즉시 제거 → 다음 프레임부터 충돌 검사 대상에서 완전 제외
      smellMarkers.splice(i, 1);

      // 수첩에 냄새 기록 추가 (smellType/color는 이미 지역 변수로 캡처)
      addSmellToNotebook(marker.userData.smellType, marker.userData.color);

      // [최적화 4] UI 업데이트를 requestAnimationFrame 바깥에서 처리해 렌더 루프 부담 최소화
      if (sequenceStatus) {
        const remaining = smellMarkers.length; // splice 후 남은 길이 = 미수집 수
        if (remaining > 0) {
          sequenceStatus.textContent = `냄새 수집 중... (${collectedSmellCount}개 수집, ${remaining}개 남음)`;
        } else {
          sequenceStatus.textContent = '모든 냄새를 수집했다! 붉게 빛나는 상자에 접근해 E 키로 조사하세요.';
        }
      }
    }
  }
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

  dogGroup.position.y = 0.60;

  /* ─── 꼬리 흔들기 (살랑살랑) ─── */
  tailGroup.rotation.y = Math.sin(elapsed * 5.5) * 0.45;
  tailGroup.rotation.z = Math.sin(elapsed * 4.0) * 0.15;

  /* ─── 다리 걷기 애니메이션 ─── */
  const isMoving = isPointerLocked && (
    moveState.forward || moveState.backward ||
    moveState.left    || moveState.right
  );

  if (isMoving) {
    walkCycle += delta * 8;
    const swing = 0.55;
    legFL.rotation.x =  Math.sin(walkCycle)           * swing;
    legBR.rotation.x =  Math.sin(walkCycle)           * swing;
    legFR.rotation.x =  Math.sin(walkCycle + Math.PI) * swing;
    legBL.rotation.x =  Math.sin(walkCycle + Math.PI) * swing;
  } else {
    const returnSpeed = 1 - Math.pow(0.05, delta);
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
  // [최적화] splice로 이미 제거된 마커는 배열에 없으므로 collected 체크 불필요
  for (let i = 0; i < smellMarkers.length; i++) {
    const marker = smellMarkers[i];
    marker.position.y = 0.18 + Math.sin(elapsed * 2.5 + i * 0.5) * 0.1;
    marker.position.x = marker.userData.baseX + Math.sin(elapsed * 1.5 + i * 0.7) * 0.05;
    const scale = 1.0 + Math.sin(elapsed * 3 + i * 0.6) * 0.2;
    marker.scale.setScalar(scale);
    if (marker.userData.light) {
      marker.userData.light.intensity = 0.4 + Math.sin(elapsed * 2 + i) * 0.3;
      marker.userData.light.position.y = marker.position.y + 0.3;
    }
  }

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
