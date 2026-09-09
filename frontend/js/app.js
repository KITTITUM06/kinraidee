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

// Modal แนะนำร้าน
function openSuggestModal() {
  document.getElementById('suggestModal').classList.remove('hidden');
}

function closeSuggestModal() {
  document.getElementById('suggestModal').classList.add('hidden');
}

async function handleSuggestSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('sugSubmitBtn');
  btn.disabled = true;
  btn.innerText = 'กำลังส่งข้อมูล...';

  const payload = {
    name: document.getElementById('sugName').value.trim(),
    category: document.getElementById('sugCat').value,
    price: Number(document.getElementById('sugPrice').value) || 50,
    calories: 450,
    spiciness: 1,
    ingredients: 'วัตถุดิบตามสั่ง',
    restaurant_name: document.getElementById('sugRest').value.trim(),
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    // ปรับเป็น recipe_summary ให้ตรงกับ DB Model
    recipe_summary: document.getElementById('sugNotes').value.trim() || 'แนะนำโดยนิสิต มอนอ'
  };

  try {
    const res = await fetch(`${API_BASE}/menus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      if (typeof showToast === 'function') {
        showToast('ขอบคุณที่ร่วมแชร์เมนูเด็ดรอบ มอนอ!', 'success');
      }
      closeSuggestModal();
      document.getElementById('suggestForm').reset();
      loadHomeMetrics();
    } else {
      if (typeof showToast === 'function') {
        showToast('ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง', 'error');
      }
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  } finally {
    btn.disabled = false;
    btn.innerText = 'ส่งแนะนำเมนูนี้เลย ✨';
  }
}

async function loadHomeMetrics() {
  const statTotal = document.getElementById('homeTotalMenus');
  const popularName = document.getElementById('homePopularName');
  const popularBadge = document.getElementById('homePopularBadge');
  const statCategory = document.getElementById('homeTopCat');
  const spotlightTitle = document.getElementById('spotlightMenuTitle');
  const spotlightRest = document.getElementById('spotlightRestaurant');
  const trendingMapBtn = document.getElementById('trendingMapBtn');

  try {
    // 1. ดึงสถิติภาพรวม
    const resStats = await fetch(`${API_BASE}/admin/stats`);
    if (!resStats.ok) return;
    const data = await resStats.json();

    if (statTotal) statTotal.innerText = `${data.total_menus || 0} รายการ`;

    let cleanName = '';
    if (data.most_randomed_menu) {
      if (data.most_randomed_menu.includes('(')) {
        const parts = data.most_randomed_menu.split('(');
        cleanName = parts[0].trim();
        if (popularName) popularName.innerText = cleanName;
        if (popularBadge) {
          popularBadge.innerText = parts[1].replace(')', '').trim();
          popularBadge.classList.remove('hidden');
        }
      } else {
        cleanName = data.most_randomed_menu.trim();
        if (popularName) popularName.innerText = cleanName;
      }
    }

    if (statCategory) statCategory.innerText = data.top_category || '-';

    // 2. ดึงข้อมูลเมนูเพื่อจับคู่ชื่อร้านจริง (แก้ปัญหาร้านป้าแว่นค้าง)
    if (cleanName) {
      if (spotlightTitle) spotlightTitle.innerText = cleanName;

      try {
        const resMenus = await fetch(`${API_BASE}/menus`);
        if (resMenus.ok) {
          const menus = await resMenus.json();
          const targetMenu = menus.find(m => m.name.trim() === cleanName);

          if (targetMenu && targetMenu.restaurant_name) {
            const actualRest = targetMenu.restaurant_name;
            
            // อัปเดตข้อความชื่อร้านบนการ์ด Trending ให้ตรงกับ DB
            if (spotlightRest) {
              spotlightRest.innerHTML = `📍  <span class="mx-1">•</span> ${actualRest}`;
            }

            // อัปเดตลิงก์ปุ่ม Google Maps ค้นหาด้วยชื่อร้านจริง
            if (trendingMapBtn) {
              trendingMapBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(actualRest + ' มหาวิทยาลัยนเรศวร')}`;
            }
          }
        }
      } catch (e) {
        console.warn("Could not fetch detailed menu for spotlight:", e);
      }
    }
  } catch (err) {
    console.warn("Backend connection waiting...");
  }
}

document.addEventListener('DOMContentLoaded', loadHomeMetrics);