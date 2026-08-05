// --- 게임 상태 데이터 ---
let dust = 0;
let shard = 0;
let xp = 0;
let level = 1;

// 해금 상태
let isShardUnlocked = false;
let isXpUnlocked = false;

// 스폰 및 채굴 대상 ("dust" 또는 "shard")
let currentTarget = "dust";
let isTargetSpawned = false;
let dustRespawnTimer = 0;
let dustMinedCountForShard = 0; // Shard 스폰을 위한 Dust 채굴 횟수 (3회 필요)

let isMining = false;
let miningProgressTicks = 0;

// 1. Dust 업그레이드 단계
// Lv0: 40틱, Lv1: 20틱 (Shard 3개), Lv2: 10틱 (Shard 6개)
let dustUpgradeLv = 0;
const dustRespawnTicksTable = [40, 20, 10];
const dustUpgradeCosts = [3, 6];

// 2. 채굴 업그레이드 단계
// Lv0: Dust 3초(60틱)
// Lv1 (Dust 5): Dust 2초(40틱)
// Lv2 (Dust 10): Dust 1초(20틱)
// Lv3 (Dust 15): Dust 0.5초(10틱)
// Lv4 (Dust 20): Dust 0.25초(5틱), Shard 3초(60틱)
// Lv5 (Dust 50): Dust 즉시(0틱), Shard 1.5초(30틱)
// Lv6 (Dust 35, Shard 10): Dust 즉시(0틱), Shard 0.75초(15틱), 3D Crystal 3초(60틱), 4D Matter 5초(100틱)
let miningUpgradeLv = 0;

// 각 단계별 채굴 시간(틱) 설정 [Dust, Shard, Crystal, Matter]
const miningTimes = [
  [60, -1, -1, -1], // Lv0
  [40, -1, -1, -1], // Lv1
  [20, -1, -1, -1], // Lv2
  [10, -1, -1, -1], // Lv3
  [5, 60, -1, -1],  // Lv4
  [0, 30, -1, -1],  // Lv5
  [0, 15, 60, 100]  // Lv6
];

// --- DOM 엘리먼트 가져오기 ---
const dustEl = document.getElementById('dust');
const shardEl = document.getElementById('shard');
const xpEl = document.getElementById('xp');
const levelEl = document.getElementById('level');
const shardContainer = document.getElementById('shardContainer');

const targetStatusEl = document.getElementById('targetStatus');
const mineBtn = document.getElementById('mineBtn');
const miningBar = document.getElementById('miningBar');

const unlockShardBox = document.getElementById('unlockShardBox');
const unlockShardBtn = document.getElementById('unlockShardBtn');
const unlockXpBox = document.getElementById('unlockXpBox');
const unlockXpBtn = document.getElementById('unlockXpBtn');

const upgradeMiningBtn = document.getElementById('upgradeMiningBtn');
const upgradeDustBtn = document.getElementById('upgradeDustBtn');

// 모달 엘리먼트
const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const closeModal = document.getElementById('closeModal');

const infoMineLv = document.getElementById('infoMineLv');
const infoDustLv = document.getElementById('infoDustLv');
const infoDustTime = document.getElementById('infoDustTime');
const infoShardTime = document.getElementById('infoShardTime');
const infoCrystalTime = document.getElementById('infoCrystalTime');
const infoMatterTime = document.getElementById('infoMatterTime');
const infoDustRespawn = document.getElementById('infoDustRespawn');

// --- UI 업데이트 함수 ---
function updateUI() {
  dustEl.innerText = dust;
  shardEl.innerText = shard;
  xpEl.innerText = xp;
  levelEl.innerText = level;

  mineBtn.disabled = !isTargetSpawned || isMining;

  // Shard 해금 상태
  if (isShardUnlocked) {
    unlockShardBox.style.display = 'none';
    shardContainer.style.display = 'inline-block';
    upgradeDustBtn.style.display = 'inline-block';
  } else {
    unlockShardBtn.disabled = dust < 30;
  }

  // XP 해금 상태
  if (isXpUnlocked) {
    unlockXpBox.style.display = 'none';
  } else {
    unlockXpBtn.disabled = dust < 50;
  }

  // 채굴 업그레이드 버튼 문구 및 비용
  if (miningUpgradeLv === 0) {
    upgradeMiningBtn.innerText = "채굴 업그레이드 (Dust 5) -> Dust 2초";
    upgradeMiningBtn.disabled = dust < 5;
  } else if (miningUpgradeLv === 1) {
    upgradeMiningBtn.innerText = "채굴 업그레이드 (Dust 10) -> Dust 1초";
    upgradeMiningBtn.disabled = dust < 10;
  } else if (miningUpgradeLv === 2) {
    upgradeMiningBtn.innerText = "채굴 업그레이드 (Dust 15) -> Dust 0.5초";
    upgradeMiningBtn.disabled = dust < 15;
  } else if (miningUpgradeLv === 3) {
    upgradeMiningBtn.innerText = "채굴 업그레이드 (Dust 20) -> Dust 0.25초 / Shard 채굴 가능(3초)";
    upgradeMiningBtn.disabled = dust < 20;
  } else if (miningUpgradeLv === 4) {
    upgradeMiningBtn.innerText = "채굴 업그레이드 (Dust 50) -> Dust 즉시 / Shard 1.5초";
    upgradeMiningBtn.disabled = dust < 50;
  } else if (miningUpgradeLv === 5) {
    upgradeMiningBtn.innerText = "채굴 업그레이드 (Dust 35, Shard 10) -> Shard 0.75초 / 신규 재화 추가";
    upgradeMiningBtn.disabled = (dust < 35 || shard < 10);
  } else {
    upgradeMiningBtn.innerText = "채굴 업그레이드 최고 레벨";
    upgradeMiningBtn.disabled = true;
  }

  // Dust 업그레이드 버튼 문구 및 비용
  if (isShardUnlocked) {
    if (dustUpgradeLv === 0) {
      upgradeDustBtn.innerText = "Dust 업그레이드 (Shard 3) -> 재생산 20틱";
      upgradeDustBtn.disabled = shard < 3;
    } else if (dustUpgradeLv === 1) {
      upgradeDustBtn.innerText = "Dust 업그레이드 (Shard 6) -> 재생산 10틱";
      upgradeDustBtn.disabled = shard < 6;
    } else {
      upgradeDustBtn.innerText = "Dust 업그레이드 최고 레벨";
      upgradeDustBtn.disabled = true;
    }
  }
}

// 틱 -> 초 변환 보조 함수
function ticksToText(ticks) {
  if (ticks < 0) return "불가";
  if (ticks === 0) return "즉시";
  return `${(ticks * 0.05).toFixed(2)}초`;
}

// 채굴 정보 모달 업데이트
function updateInfoModal() {
  infoMineLv.innerText = miningUpgradeLv;
  infoDustLv.innerText = dustUpgradeLv;

  const currentTimes = miningTimes[miningUpgradeLv];
  infoDustTime.innerText = ticksToText(currentTimes[0]);
  infoShardTime.innerText = ticksToText(currentTimes[1]);
  infoCrystalTime.innerText = ticksToText(currentTimes[2]);
  infoMatterTime.innerText = ticksToText(currentTimes[3]);

  const currentDustRespawnTicks = dustRespawnTicksTable[dustUpgradeLv];
  infoDustRespawn.innerText = `${currentDustRespawnTicks}틱 (${(currentDustRespawnTicks * 0.05).toFixed(1)}초)`;
}

// --- 이벤트 리스너 ---

// 채굴 시작
mineBtn.addEventListener('click', () => {
  if (isTargetSpawned && !isMining) {
    const timeTable = miningTimes[miningUpgradeLv];
    let targetTimeTicks = 0;

    if (currentTarget === "dust") targetTimeTicks = timeTable[0];
    else if (currentTarget === "shard") targetTimeTicks = timeTable[1];

    // 즉시 채굴일 경우
    if (targetTimeTicks === 0) {
      completeMining();
      return;
    }

    isMining = true;
    miningProgressTicks = 0;
    targetStatusEl.innerText = `${currentTarget.toUpperCase()} 채굴 진행 중...`;
    updateUI();
  }
});

// 채굴 완료 처리
function completeMining() {
  isMining = false;
  isTargetSpawned = false;

  if (currentTarget === "dust") {
    dust++;
    dustMinedCountForShard++;
    targetStatusEl.innerText = "채굴 완료! Dust +1";

    // Shard 해금 상태이고 3회 채굴 달성 시 다음 스폰 대상은 Shard
    if (isShardUnlocked && dustMinedCountForShard >= 3 && miningUpgradeLv >= 4) {
      currentTarget = "shard";
      dustMinedCountForShard = 0;
    } else {
      currentTarget = "dust";
    }
  } else if (currentTarget === "shard") {
    shard++;
    targetStatusEl.innerText = "채굴 완료! Shard +1";
    currentTarget = "dust"; // Shard 채굴 후 다시 Dust로 스폰
  }

  miningProgressTicks = 0;
  miningBar.style.width = '0%';
  updateUI();
}

// Shard 해금
unlockShardBtn.addEventListener('click', () => {
  if (dust >= 30 && !isShardUnlocked) {
    dust -= 30;
    isShardUnlocked = true;
    updateUI();
  }
});

// XP 해금
unlockXpBtn.addEventListener('click', () => {
  if (dust >= 50 && !isXpUnlocked) {
    dust -= 50;
    isXpUnlocked = true;
    updateUI();
  }
});

// 채굴 업그레이드
upgradeMiningBtn.addEventListener('click', () => {
  if (miningUpgradeLv === 0 && dust >= 5) { dust -= 5; miningUpgradeLv++; }
  else if (miningUpgradeLv === 1 && dust >= 10) { dust -= 10; miningUpgradeLv++; }
  else if (miningUpgradeLv === 2 && dust >= 15) { dust -= 15; miningUpgradeLv++; }
  else if (miningUpgradeLv === 3 && dust >= 20) { dust -= 20; miningUpgradeLv++; }
  else if (miningUpgradeLv === 4 && dust >= 50) { dust -= 50; miningUpgradeLv++; }
  else if (miningUpgradeLv === 5 && dust >= 35 && shard >= 10) {
    dust -= 35; shard -= 10; miningUpgradeLv++;
  }
  updateUI();
});

// Dust 업그레이드
upgradeDustBtn.addEventListener('click', () => {
  if (dustUpgradeLv === 0 && shard >= 3) {
    shard -= 3;
    dustUpgradeLv++;
  } else if (dustUpgradeLv === 1 && shard >= 6) {
    shard -= 6;
    dustUpgradeLv++;
  }
  updateUI();
});

// 정보 모달 열기/닫기
infoBtn.addEventListener('click', () => {
  updateInfoModal();
  infoModal.style.display = 'block';
});
closeModal.addEventListener('click', () => {
  infoModal.style.display = 'none';
});

// --- 메인 게임 루프 (1틱 = 0.05초 = 50ms) ---
setInterval(() => {
  // 1. 타겟 스폰 쿨타임
  if (!isTargetSpawned && !isMining) {
    dustRespawnTimer++;
    const targetRespawnTicks = dustRespawnTicksTable[dustUpgradeLv];

    targetStatusEl.innerText = `${currentTarget.toUpperCase()} 스폰 대기 중... (${Math.ceil((targetRespawnTicks - dustRespawnTimer) * 0.05)}초)`;

    if (dustRespawnTimer >= targetRespawnTicks) {
      isTargetSpawned = true;
      dustRespawnTimer = 0;
      targetStatusEl.innerText = `${currentTarget.toUpperCase()}가 스폰되었습니다!`;
    }
  }

  // 2. 채굴 진행
  if (isMining) {
    miningProgressTicks++;
    const timeTable = miningTimes[miningUpgradeLv];
    let targetTicks = 1;

    if (currentTarget === "dust") targetTicks = timeTable[0];
    else if (currentTarget === "shard") targetTicks = timeTable[1];

    const progressPercent = (miningProgressTicks / targetTicks) * 100;
    miningBar.style.width = `${progressPercent}%`;

    if (miningProgressTicks >= targetTicks) {
      completeMining();
    }
  }

  updateUI();
}, 50);
