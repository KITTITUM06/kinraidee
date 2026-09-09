const urlParams = new URLSearchParams(window.location.search);
const editMenuId = urlParams.get('id');

function checkAuth() {
  const isAuth = sessionStorage.getItem('isAdminAuth');
  if (!isAuth) {
    window.location.href = 'login/admin_login.html';
  }
}

// อัปเดตการ์ด Live Preview ทันทีตามที่ผู้ใช้พิมพ์ในฟอร์ม
function syncLivePreview() {
  const name = document.getElementById('menuName').value.trim();
  const cat = document.getElementById('menuCategory').value;
  const price = document.getElementById('menuPrice').value.trim();
  const cal = document.getElementById('menuCalories').value.trim();
  const spice = Number(document.getElementById('menuSpiciness').value) || 0;
  const img = document.getElementById('menuImageUrl').value.trim();
  const rest = document.getElementById('menuRestaurant').value.trim();
  const notes = document.getElementById('menuNotes').value.trim();

  document.getElementById('prevName').innerText = name || 'ชื่อเมนูอาหาร';
  document.getElementById('prevCat').innerText = cat;
  document.getElementById('prevPrice').innerText = `${price || '0'} ฿`;
  document.getElementById('prevCal').innerText = `🔥 ${cal || '0'} kcal`;
  document.getElementById('prevRest').innerText = rest ? `📍 ${rest}` : '📍 ไม่ได้ระบุร้าน';
  document.getElementById('prevNotes').innerText = notes || 'ยังไม่ได้ระบุวิธีทำหรือรายละเอียดเพิ่มเติม...';

  if (img) {
    document.getElementById('prevImage').src = img;
  }

  const spiceEl = document.getElementById('prevSpice');
  if (spice === 0) {
    spiceEl.innerText = 'ไม่เผ็ด';
    spiceEl.className = 'text-xs text-slate-400 font-semibold shrink-0';
  } else {
    spiceEl.innerText = '🌶️'.repeat(spice);
    spiceEl.className = 'text-xs text-red-500 font-bold shrink-0';
  }
}

async function loadExistingData() {
  if (!editMenuId) return;

  try {
    const res = await fetch(`${API_BASE}/menus`);
    if (!res.ok) throw new Error('Cannot load menus');
    const menus = await res.json();
    const item = menus.find(m => String(m.id) === String(editMenuId));

    if (!item) {
      showToast('ไม่พบข้อมูลเมนูนี้', 'error');
      setTimeout(() => window.location.href = 'admin.html', 1200);
      return;
    }

    document.getElementById('menuName').value = item.name || '';
    document.getElementById('menuCategory').value = item.category || 'อาหารจานเดียว';
    document.getElementById('menuPrice').value = item.price ?? '';
    document.getElementById('menuCalories').value = item.calories ?? '';
    document.getElementById('menuSpiciness').value = item.spiciness ?? 0;
    document.getElementById('menuIngredients').value = item.ingredients || '';
    document.getElementById('menuRestaurant').value = item.restaurant_name || '';
    document.getElementById('menuImageUrl').value = item.image_url || '';
    if (document.getElementById('menuNotes')) {
      document.getElementById('menuNotes').value = item.notes || '';
    }

    syncLivePreview();
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลเดิม', 'error');
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('saveBtn');

  saveBtn.disabled = true;
  saveBtn.innerText = 'กำลังบันทึก...';

  const payload = {
    name: document.getElementById('menuName').value.trim(),
    category: document.getElementById('menuCategory').value,
    price: Number(document.getElementById('menuPrice').value) || 0,
    calories: Number(document.getElementById('menuCalories').value) || 0,
    spiciness: Number(document.getElementById('menuSpiciness').value) || 0,
    ingredients: document.getElementById('menuIngredients').value.trim(),
    restaurant_name: document.getElementById('menuRestaurant').value.trim(),
    image_url: document.getElementById('menuImageUrl').value.trim(),
    notes: document.getElementById('menuNotes') ? document.getElementById('menuNotes').value.trim() : ''
  };

  const endpoint = editMenuId ? `${API_BASE}/menus/${editMenuId}` : `${API_BASE}/menus`;
  const method = editMenuId ? 'PUT' : 'POST';

  try {
    const res = await fetch(endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast(editMenuId ? 'แก้ไขข้อมูลสำเร็จ!' : 'เพิ่มเมนูใหม่เรียบร้อย!', 'success');
      setTimeout(() => {
        window.location.href = 'admin.html';
      }, 1000);
    } else {
      showToast('บันทึกไม่สำเร็จ ตรวจสอบข้อมูลอีกครั้ง', 'error');
      saveBtn.disabled = false;
      saveBtn.innerText = 'บันทึกข้อมูล';
    }
  } catch (err) {
    showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    saveBtn.disabled = false;
    saveBtn.innerText = 'บันทึกข้อมูล';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadExistingData();
});