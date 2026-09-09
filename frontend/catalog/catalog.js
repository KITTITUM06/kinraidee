let allMenus = [];
let selectedIngredients = [];
let selectedCategory = "ทั้งหมด";

// --- ระบบควบคุม Sidebar & Settings Menu ---
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

// --- ดึงข้อมูลเมนูจาก Backend ---
async function fetchMenus() {
  try {
    const res = await fetch(`${API_BASE}/menus`);
    allMenus = await res.json();
    applyFilters();
  } catch (err) {
    console.error("Error fetching menus:", err);
  }
}

// คลิกเลือก / ปลดเลือก วัตถุดิบ
function toggleIngredient(name, btn) {
  if (selectedIngredients.includes(name)) {
    selectedIngredients = selectedIngredients.filter(i => i !== name);
    btn.classList.remove('bg-amber-500', 'text-white', 'border-amber-500');
    btn.classList.add('border-slate-200', 'dark:border-slate-700');
  } else {
    selectedIngredients.push(name);
    btn.classList.add('bg-amber-500', 'text-white', 'border-amber-500');
    btn.classList.remove('border-slate-200', 'dark:border-slate-700');
  }
  document.getElementById('selectedCount').innerText = `เลือก ${selectedIngredients.length} อย่าง`;
  applyFilters();
}

function clearAllIngredients() {
  selectedIngredients = [];
  document.querySelectorAll('.ing-btn').forEach(btn => {
    btn.classList.remove('bg-amber-500', 'text-white', 'border-amber-500');
    btn.classList.add('border-slate-200', 'dark:border-slate-700');
  });
  document.getElementById('selectedCount').innerText = `เลือก 0 อย่าง`;
  applyFilters();
}

// กรองหมวดหมู่อาหาร
function filterCategory(cat, btn) {
  selectedCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(b => {
    b.classList.remove('bg-amber-500', 'text-white');
    b.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
  });
  btn.classList.add('bg-amber-500', 'text-white');
  btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
  applyFilters();
}

// --- ตรรกะการกรองแบบดั้งเดิม (ขอแค่มีวัตถุดิบที่เลือกตรงกันก็แสดงได้เลย) ---
function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase().trim();

  const filtered = allMenus.filter(m => {
    const matchName = (m.name || '').toLowerCase().includes(search);
    const matchCat = (selectedCategory === "ทั้งหมด") || (m.category === selectedCategory);
    
    let matchFridge = true;
    if (selectedIngredients.length > 0) {
      matchFridge = selectedIngredients.some(ing => m.ingredients && m.ingredients.includes(ing));
    }
    return matchName && matchCat && matchFridge;
  });

  renderGrid(filtered);
}

function renderGrid(menus) {
  const grid = document.getElementById('menuGrid');
  const empty = document.getElementById('emptyState');

  if (menus.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = menus.map(m => {
    const spiceIcon = m.spiciness === 0 ? '' : '🌶️'.repeat(m.spiciness);
    return `
      <div onclick="openModal(${m.id})" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col justify-between">
        <div>
          <div class="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <img src="${m.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
            <span class="absolute top-3 right-3 bg-white/90 dark:bg-black/70 backdrop-blur-sm text-xs font-bold text-amber-500 px-2.5 py-1 rounded-full">${m.price ?? '-'} ฿</span>
          </div>
          <div class="p-4">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${m.category || 'ทั่วไป'}</span>
              <span class="text-xs">${spiceIcon}</span>
            </div>
            <h3 class="font-bold text-slate-800 dark:text-white text-base truncate mb-1">${m.name}</h3>
            <p class="text-xs text-slate-400 line-clamp-1 mb-2">วัตถุดิบ: ${m.ingredients || '-'}</p>
          </div>
        </div>
        <div class="px-4 pb-4">
          <div class="flex items-center justify-between text-xs font-medium text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>🔥 ${m.calories ?? '-'} kcal</span>
            <span class="text-amber-500 group-hover:underline">ดูสูตร & พิกัด →</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// --- แสดงผล Modal รายละเอียด (2-in-1: ทริกสั่งร้านรอบ ม. + วิธีทำเองเด็กหอ) ---
function openModal(id) {
  const menu = allMenus.find(m => m.id === id);
  if (!menu) return;

  document.getElementById('mImg').src = menu.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
  document.getElementById('mName').innerText = menu.name;
  document.getElementById('mCat').innerText = menu.category || 'ทั่วไป';
  document.getElementById('mPrice').innerText = `${menu.price ?? '-'} ฿`;
  document.getElementById('mCal').innerText = `🔥 ${menu.calories ?? '-'} kcal`;
  document.getElementById('mSpice').innerText = menu.spiciness === 0 ? 'ระดับความเผ็ด: ไม่เผ็ด' : `ระดับความเผ็ด: ${'🌶️'.repeat(menu.spiciness)}`;
  document.getElementById('mIng').innerText = menu.ingredients || 'ไม่มีระบุ';
  
  // แปลงวิธีทำและทริกแบบ 2-in-1
  const insiderTip = menu.notes || menu.recipe_summary || 'ไม่มีข้อมูลทริกการสั่ง';
  const cookGuide = menu.ingredients 
    ? `เตรียมวัตถุดิบ (${menu.ingredients}) ปรุงรสตามชอบด้วยกระทะไฟฟ้าหรือไมโครเวฟ เมนูนี้ทำง่าย สุกไว เหมาะกับชาวหอพัก`
    : 'ใช้วัตถุดิบเท่าที่มีในตู้เย็น ปรุงสุกด้วยกระทะไฟฟ้าหรือหม้อต้ม';

  document.getElementById('mRec').innerHTML = `
    <div class="space-y-3 text-left">
      <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <span class="text-xs font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1">
          <span>📍</span> ทริกสั่งร้านรอบ มอนอ
        </span>
        <p class="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">${insiderTip}</p>
      </div>

      <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
        <span class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
          <span>🍳</span> วิธีทำกินเองฉบับเด็กหอ
        </span>
        <p class="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">${cookGuide}</p>
      </div>
    </div>
  `;
  
  const rest = menu.restaurant_name || 'ร้านอาหารตามสั่งรอบ มอนอ';
  document.getElementById('mMap').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rest + ' มหาวิทยาลัยนเรศวร')}`;
  document.getElementById('detailModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('detailModal').classList.add('hidden');
}

document.getElementById('searchInput').addEventListener('input', applyFilters);
document.addEventListener('DOMContentLoaded', fetchMenus);