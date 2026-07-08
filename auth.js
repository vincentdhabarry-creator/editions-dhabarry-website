/**
 * Protection par mot de passe — Editions Dhabarry (test)
 * Insérer <script src="/auth.js"></script> dans chaque page, avant </body>
 */
(function () {
  const PASSWORD = "dhabarry2024";
  const KEY = "ed_auth";
  const EXEMPT = []; // pages exemptées (vides = toutes protégées)

  // Déjà authentifié ?
  if (sessionStorage.getItem(KEY) === "ok") return;

  // Créer le overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = [
    "position:fixed","inset:0","z-index:99999",
    "background:#fef8f6","display:flex","flex-direction:column",
    "align-items:center","justify-content:center","gap:1.5rem",
    "font-family:'Inter',sans-serif"
  ].join(";");

  overlay.innerHTML = `
    <div style="text-align:center;max-width:360px;padding:2rem">
      <p style="font-family:'Playfair Display',Georgia,serif;font-size:1.6rem;font-weight:700;color:#1d1b1a;margin-bottom:0.3rem">Editions Dhabarry</p>
      <p style="font-size:0.75rem;letter-spacing:0.2em;color:#8B8070;text-transform:uppercase;margin-bottom:2.5rem">Accès privé — Test interne</p>
      <input id="ed-pwd" type="password" placeholder="Mot de passe"
        style="width:100%;padding:0.9rem 1rem;border:1px solid #d0c4bb;background:#fff;
               font-size:0.95rem;outline:none;color:#1d1b1a;margin-bottom:0.75rem;box-sizing:border-box"/>
      <p id="ed-err" style="color:#C4614A;font-size:0.8rem;min-height:1rem;margin-bottom:0.75rem"></p>
      <button id="ed-btn"
        style="width:100%;padding:0.9rem;background:#1d1b1a;color:#fef8f6;
               font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;
               border:none;cursor:pointer">
        ENTRER
      </button>
    </div>`;

  document.body.appendChild(overlay);

  function check() {
    const val = document.getElementById("ed-pwd").value;
    if (val === PASSWORD) {
      sessionStorage.setItem(KEY, "ok");
      overlay.remove();
    } else {
      document.getElementById("ed-err").textContent = "Mot de passe incorrect.";
      document.getElementById("ed-pwd").value = "";
      document.getElementById("ed-pwd").focus();
    }
  }

  document.getElementById("ed-btn").addEventListener("click", check);
  document.getElementById("ed-pwd").addEventListener("keydown", function(e) {
    if (e.key === "Enter") check();
  });

  setTimeout(() => document.getElementById("ed-pwd").focus(), 100);
})();
