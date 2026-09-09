document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('isAdminAuth') === 'true') {
    window.location.href = '../admin.html';
    return;
  }

  const form = document.getElementById('adminLoginForm');
  const userInp = document.getElementById('usernameInput');
  const passInp = document.getElementById('passwordInput');
  const errorMsg = document.getElementById('loginErrorMsg');
  const submitBtn = document.getElementById('loginSubmitBtn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = userInp ? userInp.value.trim() : '';
      const pass = passInp ? passInp.value.trim() : '';

      if (user === 'admin' && (pass === 'admin1234' || pass === '1234')) {
        sessionStorage.setItem('isAdminAuth', 'true');
        if (errorMsg) errorMsg.classList.add('hidden');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'กำลังเข้าสู่ระบบ...';
        }
        window.location.href = '../admin.html';
      } else {
        if (errorMsg) {
          errorMsg.classList.remove('hidden');
          errorMsg.innerText = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        }
        if (passInp) {
          passInp.value = '';
          passInp.focus();
        }
      }
    });
  }
});

function togglePasswordVisibility() {
  const passInp = document.getElementById('passwordInput');
  if (!passInp) return;
  passInp.type = passInp.type === 'password' ? 'text' : 'password';
}