/**
 * UI Feedback System: Toast & Custom Confirm Modal
 * ใช้แทน alert() และ confirm() ทั่วทั้งระบบ KinRaiDee
 */

// 1. Toast Notification (มุมขวาล่าง เลื่อนเข้ามาแล้วเฟดออกไปเอง)
function showToast(message, type = 'success', duration = 3000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  const borderCol = type === 'success' 
    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' 
    : type === 'error' 
    ? 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300' 
    : 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300';

  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 shadow-2xl text-xs sm:text-sm font-semibold transform translate-y-6 opacity-0 transition-all duration-300 ${borderCol}`;
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  // เลื่อนเข้ามา
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-6', 'opacity-0');
  });

  // จางหายและลบออก
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// 2. Custom Confirmation Modal (ส่งค่ากลับเป็น Promise<boolean> แทน confirm())
function showConfirmModal(title, description, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก') {
  return new Promise((resolve) => {
    let modalRoot = document.getElementById('customConfirmModalRoot');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'customConfirmModalRoot';
      document.body.appendChild(modalRoot);
    }

    modalRoot.innerHTML = `
      <div id="confirmBackdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4 transition-opacity duration-200 opacity-0">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl transform scale-95 transition-all duration-200">
          <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl mb-4">
            ⚠️
          </div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1.5">${title}</h3>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">${description}</p>
          <div class="flex items-center gap-2.5">
            <button id="cancelModalBtn" class="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition">
              ${cancelText}
            </button>
            <button id="okModalBtn" class="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition">
              ${confirmText}
            </button>
          </div>
        </div>
      </div>
    `;

    const backdrop = document.getElementById('confirmBackdrop');
    requestAnimationFrame(() => backdrop.classList.remove('opacity-0'));

    const cleanup = (val) => {
      backdrop.classList.add('opacity-0');
      setTimeout(() => {
        modalRoot.innerHTML = '';
        resolve(val);
      }, 200);
    };

    document.getElementById('okModalBtn').onclick = () => cleanup(true);
    document.getElementById('cancelModalBtn').onclick = () => cleanup(false);
  });
}