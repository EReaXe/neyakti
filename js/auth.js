const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMessage = document.getElementById("authMessage");

function showAuthMessage(message, type = "error") {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.className = `auth-message ${type}`;
}

function translateAuthError(message) {
  const translations = {
    "Invalid login credentials": "E-posta veya şifre hatalı.",
    "User already registered": "Bu e-posta adresi zaten kayıtlı.",
    "Password should be at least 6 characters": "Şifre en az 6 karakter olmalıdır.",
    "Email not confirmed": "E-posta adresini doğrulamalısın."
  };

  return translations[message] || message;
}

async function redirectAuthenticatedUser() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) window.location.replace("index.html");
}

redirectAuthenticatedUser();

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = loginForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  showAuthMessage("Giriş yapılıyor...", "success");

  try {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (!data.session) throw new Error("Oturum oluşturulamadı.");

    window.location.replace("index.html");
  } catch (error) {
    showAuthMessage(translateAuthError(error.message));
  } finally {
    submitButton.disabled = false;
  }
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = registerForm.querySelector("button[type='submit']");
  submitButton.disabled = true;

  try {
    const fullName = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const passwordConfirm = document.getElementById("registerPasswordConfirm").value;

    if (password !== passwordConfirm) {
      throw new Error("Şifreler birbiriyle uyuşmuyor.");
    }

    showAuthMessage("Hesap oluşturuluyor...", "success");

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) throw error;

    if (data.session) {
      window.location.replace("index.html");
      return;
    }

    registerForm.reset();
    showAuthMessage(
      "Kayıt başarılı. E-posta adresine gönderilen doğrulama bağlantısına tıkla.",
      "success"
    );
  } catch (error) {
    showAuthMessage(translateAuthError(error.message));
  } finally {
    submitButton.disabled = false;
  }
});
