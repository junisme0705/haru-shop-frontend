/* =======================================
   XỬ LÝ QUÊN MẬT KHẨU & ĐỔI MẬT KHẨU BẰNG OTP
   (File: JS/ForgotPassword.JS)
   ======================================= */

document.addEventListener('DOMContentLoaded', () => {
    const step1Form = document.getElementById('step1-forgot-form');
    const step2Form = document.getElementById('step2-reset-form');
    const emailInput = document.getElementById('forgot-email');
    const btnSendOtp = document.getElementById('btn-send-otp');
    const step1Error = document.getElementById('step1-error');

    const otpInput = document.getElementById('reset-otp');
    const newPassInput = document.getElementById('reset-new-password');
    const btnResetPass = document.getElementById('btn-reset-pass');
    const step2Error = document.getElementById('step2-error');

    let savedEmail = '';

    // --- HÀM 1: GỬI EMAIL LẤY OTP ---
    if (step1Form) {
        step1Form.addEventListener('submit', async (e) => {
            e.preventDefault();
            savedEmail = emailInput.value.trim();

            if (!savedEmail) return;

            step1Error.style.display = 'none';
            btnSendOtp.disabled = true;
            btnSendOtp.innerText = 'Đang gửi mã...';

            try {
                const response = await fetch('https://haru-shop-backend-production.up.railway.app/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: savedEmail })
                });
                const data = await response.json();

                if (data.success) {
                    step1Form.style.display = 'none';
                    step2Form.style.display = 'block';
                } else {
                    step1Error.innerText = data.message;
                    step1Error.style.display = 'block';
                    btnSendOtp.disabled = false;
                    btnSendOtp.innerText = 'Gửi mã OTP';
                }
            } catch (err) {
                step1Error.innerText = 'Lỗi kết nối Server!';
                step1Error.style.display = 'block';
                btnSendOtp.disabled = false;
                btnSendOtp.innerText = 'Gửi mã OTP';
            }
        });
    }

    // --- HÀM 2: ĐỔI MẬT KHẨU BẰNG OTP ---
    if (step2Form) {
        step2Form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = otpInput.value.trim();
            const newPassword = newPassInput.value;

            // Kiểm tra mật khẩu dài tối thiểu 8 ký tự
            if (newPassword.length < 8) {
                step2Error.innerText = 'Mật khẩu phải có ít nhất 8 ký tự.';
                step2Error.style.display = 'block';
                return;
            }

            step2Error.style.display = 'none';
            btnResetPass.disabled = true;
            btnResetPass.innerText = 'Đang xác nhận...';

            try {
                const response = await fetch('https://haru-shop-backend-production.up.railway.app/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: savedEmail, otp: otp, newPassword: newPassword })
                });
                const data = await response.json();

                if (data.success) {
                    btnResetPass.innerText = 'Thành công!';
                    btnResetPass.style.backgroundColor = '#28a745'; // Nút xanh lá

                    setTimeout(() => {
                        alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
                        window.location.href = 'Login.HTML';
                    }, 1500);
                } else {
                    step2Error.innerText = data.message;
                    step2Error.style.display = 'block';
                    btnResetPass.disabled = false;
                    btnResetPass.innerText = 'Xác nhận đổi mật khẩu';
                }
            } catch (err) {
                step2Error.innerText = 'Lỗi kết nối Server!';
                step2Error.style.display = 'block';
                btnResetPass.disabled = false;
                btnResetPass.innerText = 'Xác nhận đổi mật khẩu';
            }
        });
    }
});