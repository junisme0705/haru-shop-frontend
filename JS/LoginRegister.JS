/* =======================================
   XỬ LÝ ĐĂNG NHẬP & ĐĂNG KÝ
   (File: JS/LoginRegister.JS)
   ======================================= */

// --- HÀM KIỂM TRA MẬT KHẨU MẠNH ---
function getPasswordError(password) {
    if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
    if (!/[A-Z]/.test(password)) return "Mật khẩu phải chứa ít nhất 1 chữ hoa.";
    if (!/[a-z]/.test(password)) return "Mật khẩu phải chứa ít nhất 1 chữ thường.";
    if (!/[0-9]/.test(password)) return "Mật khẩu phải chứa ít nhất 1 số.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (VD: @, #, !).";
    return null;
}

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. XỬ LÝ TRANG LOGIN ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const loginButton = document.getElementById('login-button');

        const errorMessage = document.createElement('p');
        errorMessage.style.color = '#ffcccc';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.marginTop = '10px';
        errorMessage.style.marginBottom = '15px';
        errorMessage.style.display = 'none';
        loginForm.insertBefore(errorMessage, loginButton);

        function checkLoginValidity() {
            const email = emailInput.value;
            const password = passwordInput.value;
            const emailRegex = /\S+@\S+\.\S+/;
            if (emailRegex.test(email) && password.length > 0) {
                loginButton.disabled = false;
            } else {
                loginButton.disabled = true;
            }
        }
        emailInput.addEventListener('input', checkLoginValidity);
        passwordInput.addEventListener('input', checkLoginValidity);

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.style.display = 'none';

            const email = emailInput.value;
            const password = passwordInput.value;

            loginButton.disabled = true;
            loginButton.innerText = 'ĐANG KẾT NỐI SERVER...';

            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('haru-current-user', JSON.stringify(data.user));

                    // FIX: XÓA ALERT, ĐỔI MÀU NÚT & CHUYỂN TRANG MƯỢT
                    loginButton.innerText = 'Đăng nhập thành công!';
                    loginButton.style.backgroundColor = '#28a745'; // Màu xanh lá

                    setTimeout(() => {
                        window.location.href = 'Index.HTML';
                    }, 1000);

                } else {
                    errorMessage.innerText = data.message;
                    errorMessage.style.display = 'block';
                    loginButton.disabled = false;
                    loginButton.innerText = 'Đăng nhập';
                }
            } catch (err) {
                console.error(err);
                errorMessage.innerText = 'Không thể kết nối tới Server.';
                errorMessage.style.display = 'block';
                loginButton.disabled = false;
                loginButton.innerText = 'Đăng nhập';
            }
        });
    }

    // --- 2. XỬ LÝ TRANG REGISTER ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        const emailInput = document.getElementById('email');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const registerButton = document.getElementById('register-button');

        const errorMessage = document.createElement('p');
        errorMessage.style.color = '#ffcccc';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.marginTop = '-10px';
        errorMessage.style.marginBottom = '15px';
        errorMessage.style.fontSize = '13px';
        errorMessage.style.display = 'none';
        registerForm.insertBefore(errorMessage, registerButton);

        function checkRegisterValidity() {
            const email = emailInput.value;
            const username = usernameInput.value;
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            const emailRegex = /\S+@\S+\.\S+/;
            const isEmailValid = emailRegex.test(email);
            const passwordError = getPasswordError(password);
            const isPasswordMatch = (password === confirmPassword) && (password.length > 0);

            if (isEmailValid && username.length > 0 && passwordError === null && isPasswordMatch) {
                registerButton.disabled = false;
                errorMessage.style.display = 'none';
            } else {
                registerButton.disabled = true;

                if (password.length > 0 && passwordError) {
                    errorMessage.innerText = passwordError;
                    errorMessage.style.display = 'block';
                } else if (password.length > 0 && !isPasswordMatch && confirmPassword.length > 0) {
                    errorMessage.innerText = "Mật khẩu xác nhận không khớp.";
                    errorMessage.style.display = 'block';
                } else {
                    errorMessage.style.display = 'none';
                }
            }
        }

        emailInput.addEventListener('input', checkRegisterValidity);
        usernameInput.addEventListener('input', checkRegisterValidity);
        passwordInput.addEventListener('input', checkRegisterValidity);
        confirmPasswordInput.addEventListener('input', checkRegisterValidity);

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.style.display = 'none';

            const email = emailInput.value;
            const username = usernameInput.value;
            const password = passwordInput.value;

            const passError = getPasswordError(password);
            if (passError) {
                errorMessage.innerText = passError;
                errorMessage.style.display = 'block';
                return;
            }

            registerButton.disabled = true;
            registerButton.innerText = 'ĐANG GỬI DỮ LIỆU...';

            try {
                const response = await fetch('http://localhost:3000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, username, password })
                });

                const data = await response.json();

                if (data.success) {
                    // FIX: XÓA ALERT, ĐỔI MÀU NÚT & CHUYỂN TRANG MƯỢT
                    registerButton.innerText = 'Đăng ký thành công!';
                    registerButton.style.backgroundColor = '#28a745';

                    setTimeout(() => {
                        window.location.href = 'Login.HTML';
                    }, 1000);
                } else {
                    errorMessage.innerText = data.message;
                    errorMessage.style.display = 'block';
                    registerButton.disabled = false;
                    registerButton.innerText = 'Đăng ký';
                }
            } catch (err) {
                console.error(err);
                errorMessage.innerText = 'Không thể kết nối tới Server!';
                errorMessage.style.display = 'block';
                registerButton.disabled = false;
                registerButton.innerText = 'Đăng ký';
            }
        });
    }

    // --- 3. XỬ LÝ SOCIAL LOGIN (TẠM THỜI GỠ ALERT CHỜ TÍCH HỢP BACKEND) ---
    const googleBtn = document.getElementById('google-login-btn');
    const fbBtn = document.getElementById('facebook-login-btn');

    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            googleBtn.style.opacity = "0.5";
            googleBtn.innerText = '...';
            // Chuẩn bị link gọi Backend ở bước tiếp theo
        });
    }

    if (fbBtn) {
        fbBtn.addEventListener('click', () => {
            fbBtn.style.opacity = "0.5";
            fbBtn.innerText = '...';
            // Chuẩn bị link gọi Backend ở bước tiếp theo
        });
    }
});