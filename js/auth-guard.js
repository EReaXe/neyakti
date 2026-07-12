window.authReady = (async () => {
  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error || !session) {
    window.location.replace("login.html");
    return null;
  }

  document.getElementById("userEmail").textContent = session.user.email || "";
  return session.user;
})();

document.getElementById("logoutButton")?.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.replace("login.html");
});
