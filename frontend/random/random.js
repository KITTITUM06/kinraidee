let foodPool = [];
let lastIndex = -1;
let selectedCategory = "ทั้งหมด";

// --- Web Audio SFX Generator (สร้างเสียงโดยตรงในเบราว์เซอร์) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playShuffleSFX() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 + Math.random() * 180, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    }, i * 350);
  }
}

function playRevealSFX() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const freqs = [523.25, 659.25, 783.99, 1046.50]; // โน้ต C - E - G - High C ✨
  freqs.forEach((freq, idx) => {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    }, idx * 90);
  });
}

// --- ระบบควบคุม Sidebar & Settings ---
function toggleSidebar() {
  const sidebar = document.getElementById('sidebarDrawer');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;

  const isOpen = !sidebar.classList.contains('-translate-x-full');
  if (isOpen) {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  } else {
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function toggleSettingsMenu(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('settingsDropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('settingsDropdown');
  if (dropdown && !dropdown.classList.contains('hidden') && !dropdown.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

// --- ดึงข้อมูลเมนูและสถิติ ---
async function fetchMenuPool() {
  try {
    const res = await fetch(`${API_BASE}/menus`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      foodPool = data;
      updatePoolCount();
    }
  } catch (err) {
    console.log('กำลังรอเชื่อมต่อ Backend...');
  }
}

function updatePoolCount() {
  const countBadge = document.getElementById('poolCountBadge');
  if (!countBadge) return;
  const filtered = selectedCategory === "ทั้งหมด" 
    ? foodPool 
    : foodPool.filter(m => m.category === selectedCategory);
  countBadge.innerText = `${filtered.length} รายการ`;
}

function setCategory(cat, btn) {
  selectedCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updatePoolCount();
}

function pickRandomFood() {
  if (!foodPool || foodPool.length === 0) return null;
  
  const filtered = selectedCategory === "ทั้งหมด" 
    ? foodPool 
    : foodPool.filter(m => m.category === selectedCategory);

  const pool = filtered.length > 0 ? filtered : foodPool;
  if (pool.length <= 1) return pool[0];

  let idx;
  let guard = 0;
  do {
    idx = Math.floor(Math.random() * pool.length);
    guard++;
    if (guard > 500) break;
  } while (idx === lastIndex);
  lastIndex = idx;
  return pool[idx];
}

function fillCard(item) {
  if (!item) return;
  document.getElementById('resImage').src = item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
  document.getElementById('resName').innerText = item.name || '(ไม่มีชื่อ)';
  document.getElementById('resCategory').innerText = item.category || 'อาหารทั่วไป';
  document.getElementById('resPrice').innerText = `${item.price ?? '-'} ฿`;
  document.getElementById('resCalories').innerText = `🔥 พลังงาน: ${item.calories ?? '-'} kcal`;
  document.getElementById('resIngredients').innerText = item.ingredients ? `วัตถุดิบ: ${item.ingredients}` : 'ไม่มีระบุวัตถุดิบ';
  
  const spiciness = Number(item.spiciness) || 0;
  document.getElementById('resSpice').innerHTML = spiciness === 0 
    ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> ไม่เผ็ด</span>' 
    : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold">${'🌶️'.repeat(spiciness)}</span>`;

  const restName = item.restaurant_name || 'ร้านอาหารตามสั่งทั่วไป';
  document.getElementById('resRestName').innerText = restName;
  document.getElementById('resMapLink').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restName)}`;
}

// แอนิเมชันสลับฝาชี 3 อัน พร้อมเสียง
function playShuffleAnimation(chosen, spinBtn, retryBtn) {
  const lidWrapper = document.getElementById('lidWrapper');
  const lidItems = document.querySelectorAll('.lid-item');
  const lid1 = document.getElementById('lid1');
  const lid2 = document.getElementById('lid2');
  const lid3 = document.getElementById('lid3');
  const resultCard = document.getElementById('resultCard');
  const categoryBar = document.getElementById('categoryBar');
  const poolCountWrapper = document.getElementById('poolCountWrapper');

  if (categoryBar) categoryBar.classList.add('opacity-0', 'pointer-events-none');

  lidWrapper.classList.remove('hidden');
  resultCard.classList.add('hidden');
  resultCard.classList.remove('card-appear');

  lidItems.forEach(item => {
    item.classList.remove('lid-lift-vanish', 'opacity-0', 'scale-75', 'anim-shuffle-1', 'anim-shuffle-2', 'anim-shuffle-3', 'lid-shaking');
    void item.offsetWidth;
  });

  // 1. สั่นฝาชี
  lidItems.forEach(item => item.classList.add('lid-shaking'));

  setTimeout(() => {
    // 2. หมุนสลับพร้อมเล่นเสียงสับฝาชี
    playShuffleSFX();

    lidItems.forEach(item => item.classList.remove('lid-shaking'));
    lid1.classList.add('anim-shuffle-1');
    lid2.classList.add('anim-shuffle-2');
    lid3.classList.add('anim-shuffle-3');

    setTimeout(() => {
      // 3. หยุดสลับ & เฟดฝาชีซ้ายขวาออก
      lid1.classList.remove('anim-shuffle-1');
      lid2.classList.remove('anim-shuffle-2');
      lid3.classList.remove('anim-shuffle-3');

      lid1.classList.add('opacity-0', 'scale-75');
      lid3.classList.add('opacity-0', 'scale-75');

      setTimeout(() => {
        // 4. ฝาชีกลางเปิดลอยขึ้น และเผยผลลัพธ์พร้อมเสียงเฉลย
        fillCard(chosen);
        lid2.classList.add('lid-lift-vanish');
        playRevealSFX();

        setTimeout(() => {
          lidWrapper.classList.add('hidden');
          resultCard.classList.remove('hidden');
          resultCard.classList.add('card-appear');

          if (categoryBar) categoryBar.classList.add('hidden');
          if (poolCountWrapper) poolCountWrapper.classList.add('hidden');

          if (spinBtn) spinBtn.classList.add('hidden');
          retryBtn.classList.remove('hidden');
          retryBtn.disabled = false;
          retryBtn.innerHTML = '<span class="text-amber-400 text-xl">🔄</span> สุ่มใหม่อีกรอบ';
        }, 300);
      }, 500);
    }, 1500);
  }, 400);
}

function handleGacha(e) {
  if (e) e.preventDefault();
  const spinBtn = document.getElementById('spinBtn');
  const retryBtn = document.getElementById('retryBtn');

  spinBtn.disabled = true;
  spinBtn.classList.add('opacity-50', 'cursor-not-allowed');

  const chosen = pickRandomFood();
  fetch(`${API_BASE}/menus/random`).catch(() => {});

  playShuffleAnimation(chosen, spinBtn, retryBtn);
}

function handleReroll(e) {
  if (e) e.preventDefault();
  const retryBtn = document.getElementById('retryBtn');

  retryBtn.disabled = true;
  retryBtn.innerHTML = '⏳ กำลังสลับฝาชี...';

  const chosen = pickRandomFood();
  fetch(`${API_BASE}/menus/random`).catch(() => {});

  playShuffleAnimation(chosen, null, retryBtn);
}

document.addEventListener('DOMContentLoaded', fetchMenuPool);