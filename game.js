// --- 게임 상태 데이터 ---
let ticks = 0; // 1틱 = 0.05초 (50ms)

// 자원 및 레벨
let dust = 0;
let shard = 0;
let xp = 0;
let level = 1;

// 해금 상태
let isShardUnlocked = false;
let isXpUnlocked = false;

// Dust 스폰 및 채굴 관련 상태
let isDustSpawned = false;
let dustRespawnTimer = 0;
const DUST_RESPAWN_TICKS = 40; // 40틱 = 2초

let isMining = false;
let miningProgressTicks = 0;

// 속도 업그레이드 상태 (0단계: 3초=60틱, 1단계: 2초=40틱, 2단계: 1초=20틱)
let speedUpgradeLevel = 0;
const speedUpgradeCosts = [5, 10]; 
const miningTimesInTicks = [60, 40, 20]; 

// --- DOM 엘리먼트 가져오기 ---
const dustEl = document.getElementById('dust');
const shardEl = document.getElementById('shard');
const xpEl = document.getElementById('xp');
const levelEl = document.getElementById('level');
const shardContainer = document.getElementById('shardContainer');

const dustStatusEl = document.getElementById('dustStatus');
const mineBtn = document.getElementById('mineBtn');
const miningBar = document.getElementById('miningBar');

const unlockShardBox = document.getElementById('unlockShardBox');
const unlockShardBtn = document.getElementById('unlockShardBtn');
const unlockXpBox = document.getElementById('unlockXpBox');
const unlockXpBtn = document.getElementById('unlockXpBtn');
const upgradeSpeedBtn = document.getElementById('upgradeSpeedBtn');
const mainUpgradeBtn = document.getElementById('mainUpgradeBtn');

// --- UI 업데이트 함수 ---
function updateUI() {
  dustEl.innerText = dust;
  shardEl.innerText = shard;
  xpEl.innerText = xp;
  levelEl.innerText = level;

  // 채굴 버튼 활성화 조건: Dust가 스폰되어 있고 + 채굴 중이 아닐 때
  mineBtn.disabled = !isDustSpawned || isMining;

  // Shard 해금 버튼
  if (isShardUnlocked) {
    unlockShardBox.style.display = 'none';
    shardContainer.style.display = 'inline-block';
    mainUpgradeBtn.style.display = 'inline-block';
  } else {
    unlockShardBtn.disabled = dust < 30;
  }

  // XP 해금 버튼
  if (isXpUnlocked) {
    unlockXpBox.style.display = 'none';
  } else {
    unlockXpBtn.disabled = dust < 50;
  }

  // 속도 업그레이드 버튼
  if (speedUpgradeLevel < speedUpgradeCosts.length) {
    const cost = speedUpgradeCosts[speedUpgradeLevel];
    const nextTime = speedUpgradeLevel === 0 ? "2초" : "1초";
    upgradeSpeedBtn.innerText = `채굴 속도 업그레이드 (${nextTime}로 단축) - Dust ${cost}`;
    upgradeSpeedBtn.disabled = dust < cost;
  } else {
    upgradeSpeedBtn.innerText = `채굴 속도 최고 레벨 (1초)`;
    upgradeSpeedBtn.disabled = true;
  }

  // 메인 차원 업그레이드 버튼 (Shard 3개 필요)
  if (isShardUnlocked) {
    mainUpgradeBtn.disabled = shard < 3;
  }
}

// --- 이벤트 리스너 설정 ---

// 1. Dust 채굴 시작
mineBtn.addEventListener('click', () => {
  if (isDustSpawned && !isMining) {
    isMining = true;
    miningProgressTicks = 0;
    dustStatusEl.innerText = "채굴 진행 중...";
    updateUI();
  }
});

// 2. Shard 해금
unlockShardBtn.addEventListener('click', () => {
  if (dust >= 30 && !isShardUnlocked) {
    dust -= 30;
    isShardUnlocked = true;
    updateUI();
  }
});

// 3. XP 해금
unlockXpBtn.addEventListener('click', () => {
  if (dust >= 50 && !isXpUnlocked) {
    dust -= 50;
    isXpUnlocked = true;
    updateUI();
  }
});

// 4. 채굴 속도 업그레이드
upgradeSpeedBtn.addEventListener('click', () => {
  if (speedUpgradeLevel < speedUpgradeCosts.length) {
    const cost = speedUpgradeCosts[speedUpgradeLevel];
    if (dust >= cost) {
      dust -= cost;
      speedUpgradeLevel++;
      updateUI();
    }
  }
});

// --- 메인 게임 루프 (1틱 = 0.05초 = 50ms마다 실행) ---
setInterval(() => {
  ticks++;

  // 1. Dust 스폰 / 재생산 쿨타임 로직
  if (!isDustSpawned && !isMining) {
    dustRespawnTimer++;
    dustStatusEl.innerText = `Dust 재생산 중... (${Math.ceil((DUST_RESPAWN_TICKS - dustRespawnTimer) * 0.05)}초)`;
    
    if (dustRespawnTimer >= DUST_RESPAWN_TICKS) {
      isDustSpawned = true;
      dustRespawnTimer = 0;
      dustStatusEl.innerText = "Dust가 스폰되었습니다! (채굴 가능)";
    }
  }

  // 2. 채굴 진행 로직
  if (isMining) {
    miningProgressTicks++;
    const targetTicks = miningTimesInTicks[speedUpgradeLevel];
    const progressPercent = (miningProgressTicks / targetTicks) * 100;
    miningBar.style.width = `${progressPercent}%`;

    // 채굴 완료 시
    if (miningProgressTicks >= targetTicks) {
      isMining = false;
      isDustSpawned = false; // 채굴했으므로 Dust 사라짐
      dust++;
      
      // Shard / XP 해금된 상태라면 확률적으로 획득하거나 추가 생산하는 로직을 확장할 수 있습니다.
      
      miningProgressTicks = 0;
      miningBar.style.width = '0%';
      dustStatusEl.innerText = "채굴 완료! Dust +1";
    }
  }

  updateUI();
}, 50); // 50ms = 0.05초 (1틱)
