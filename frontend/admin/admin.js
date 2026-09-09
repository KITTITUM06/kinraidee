let allAdminMenus = [];

function checkAuth() {
  const isAuth = sessionStorage.getItem('isAdminAuth');
  if (isAuth !== 'true') {
    window.location.href = 'login/admin_login.html';
    return false;
  }
  const body = document.getElementById('adminBody');
  if (body) body.classList.remove('hidden');
  return true;
}

function handleLogout() {
  sessionStorage.removeItem('isAdminAuth');
  window.location.href = '../index.html';
}

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) return;
    const data = await res.json();
    
    document.getElementById('statTotalCount').innerText = `${data.total_menus || 0} เมนู`;
    document.getElementById('statTopRandomed').innerText = data.most_randomed_menu || '-';
    document.getElementById('statTopCategory').innerText = data.top_category || '-';
  } catch (err) {
    console.warn('Cannot load admin stats');
  }
}

async function loadMenuList() {
  const tbody = document.getElementById('menuTableBody');
  try {
    const res = await fetch(`${API_BASE}/menus`);
    if (!res.ok) throw new Error('Fetch failed');
    allAdminMenus = await res.json();
    renderTable(allAdminMenus);
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="py-12 text-center text-red-400">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้</td>
      </tr>
    `;
  }
}

function renderTable(menus) {
  const tbody = document.getElementById('menuTableBody');
  if (menus.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="py-12 text-center text-slate-400">ไม่พบข้อมูลเมนูอาหาร</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = menus.map(m => {
    const spiceNum = Number(m.spiciness) || 0;
    const spiceDisplay = spiceNum === 0 
      ? '<span class="text-slate-300 whitespace-nowrap">ไม่เผ็ด</span>' 
      : `<span class="text-red-500 font-bold whitespace-nowrap">${'🌶️'.repeat(spiceNum)}</span>`;

    return `
      <tr class="hover:bg-slate-50/60 transition">
        <!-- รูปภาพ ป้องกันการบีบรูป -->
        <td class="py-3 px-3 w-14 shrink-0">
          <img src="${m.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80'}" class="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200">
        </td>

        <!-- ชื่อเมนู: ป้องกันตัดบรรทัดแปลกๆ -->
        <td class="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
          ${m.name || '-'}
        </td>

        <!-- หมวดหมู่: ใส่ whitespace-nowrap ทั้ง td และ span ไม่ให้แยกบรรทัดเด็ดขาด -->
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold whitespace-nowrap">
            ${m.category || 'ทั่วไป'}
          </span>
        </td>

        <!-- ราคา -->
        <td class="py-3 px-4 text-center font-bold text-emerald-600 whitespace-nowrap">
          ${m.price ?? '-'} ฿
        </td>

        <!-- แคลอรี่ -->
        <td class="py-3 px-4 text-center text-slate-500 font-medium whitespace-nowrap">
          ${m.calories ?? '-'} kcal
        </td>

        <!-- ความเผ็ด -->
        <td class="py-3 px-4 text-center whitespace-nowrap">
          ${spiceDisplay}
        </td>

        <!-- จำนวนครั้งที่สุ่ม -->
        <td class="py-3 px-4 text-center font-bold text-amber-500 whitespace-nowrap">
          ${m.random_count || 0}
        </td>

        <!-- ปุ่มจัดการ -->
        <td class="py-3 px-4 text-center whitespace-nowrap">
          <div class="flex items-center justify-center gap-3 text-slate-400">
            <a href="admin_edit.html?id=${m.id}" title="แก้ไข" class="hover:text-amber-500 transition text-sm">
              ✏️
            </a>
            <button type="button" onclick="deleteMenu(${m.id})" title="ลบ" class="hover:text-red-500 transition text-sm">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterTableData() {
  const query = document.getElementById('searchMenuInput').value.toLowerCase().trim();
  const category = document.getElementById('filterCategorySelect').value;

  const filtered = allAdminMenus.filter(m => {
    const matchName = (m.name || '').toLowerCase().includes(query);
    const matchCat = category === 'ทั้งหมด' || m.category === category;
    return matchName && matchCat;
  });

  renderTable(filtered);
}

async function deleteMenu(id) {
  const confirmed = await showConfirmModal(
    "ยืนยันการลบเมนู",
    "คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้ออกจากระบบ? ข้อมูลจะไม่สามารถกู้คืนได้"
  );

  if (confirmed) {
    try {
      const res = await fetch(`${API_BASE}/menus/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("ลบเมนูเรียบร้อยแล้ว", "success");
        loadMenuList();
        loadStats();
      } else {
        showToast("ไม่สามารถลบได้", "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    loadStats();
    loadMenuList();
  }
});