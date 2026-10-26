// admin.js — SNAC ANIME Admin Panel (Firebase powered)
(function () {
  "use strict";

  const ADMIN_KEY = "snac_admin_auth";
  const DEFAULT_PASS = "HM-385-MH";
  let _listCache = [];

  const $ = (s) => document.querySelector(s);
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      t.style.cssText = "position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#00ffaa;color:#02110b;padding:12px 24px;border-radius:8px;font-family:monospace;font-weight:700;z-index:9999;transition:opacity .3s;opacity:1;";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = "1";
    clearTimeout(t._tid);
    t._tid = setTimeout(() => { t.style.opacity = "0"; }, 2500);
  }

  const isAuthed = () => sessionStorage.getItem(ADMIN_KEY) === "1";
  function login(pass) {
    if (pass === DEFAULT_PASS) { sessionStorage.setItem(ADMIN_KEY, "1"); return true; }
    return false;
  }
  function logout() { sessionStorage.removeItem(ADMIN_KEY); location.reload(); }

  async function showPanel() {
    $("#loginView").style.display = "none";
    $("#panelView").style.display = "block";
    await loadFromFirebase();
  }

  function readForm() {
    return {
      id: $("#fId").value.trim(),
      title: $("#fTitle").value.trim(),
      titleBn: $("#fTitleBn").value.trim(),
      genre: $("#fGenre").value.split(",").map((s) => s.trim()).filter(Boolean),
      year: parseInt($("#fYear").value, 10) || 0,
      language: $("#fLanguage").value,
      status: $("#fStatus").value,
      rating: parseFloat($("#fRating").value) || 0,
      poster: $("#fPoster").value.trim(),
      description: $("#fDesc").value.trim(),
      telegramUrl: $("#fTelegram").value.trim(),
      trending: $("#fTrending").checked,
      latest: $("#fLatest").checked,
    };
  }

  function fillForm(a) {
    $("#editId").value = a.id;
    $("#fId").value = a.id;
    $("#fId").disabled = true;
    $("#fTitle").value = a.title || "";
    $("#fTitleBn").value = a.titleBn || "";
    $("#fGenre").value = (a.genre || []).join(", ");
    $("#fYear").value = a.year || "";
    $("#fLanguage").value = a.language || "Hindi Dubbed";
    $("#fStatus").value = a.status || "Ongoing";
    $("#fRating").value = a.rating ?? "";
    $("#fPoster").value = a.poster || "";
    $("#fDesc").value = a.description || "";
    $("#fTelegram").value = a.telegramUrl || "";
    $("#fTrending").checked = !!a.trending;
    $("#fLatest").checked = !!a.latest;
    $("#formTitle").textContent = "✏ EDIT: " + a.title;
    $("#saveBtn").textContent = "💾 UPDATE";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    $("#animeForm").reset();
    $("#editId").value = "";
    $("#fId").disabled = false;
    $("#formTitle").textContent = "➕ NEW ANIME ENTRY";
    $("#saveBtn").textContent = "💾 SAVE";
    $("#formMsg").textContent = "";
    $("#formMsg").className = "hack-msg";
  }

  function validate(a) {
    if (!a.id) return "ID required";
    if (!/^[a-z0-9-]+$/.test(a.id)) return "ID must be lowercase letters, numbers, hyphens only";
    if (!a.title) return "Title required";
    if (!a.genre.length) return "At least one genre required";
    if (!a.year) return "Year required";
    if (a.telegramUrl && !/^https?:\/\/t\.me\//i.test(a.telegramUrl)) return "Invalid Telegram URL (must be https://t.me/...)";
    if (a.poster && !/^https?:\/\//i.test(a.poster)) return "Invalid Poster URL (must start http/https)";
    return "";
  }

  async function saveAnime(e) {
    e.preventDefault();
    const msg = $("#formMsg");
    const a = readForm();
    const editId = $("#editId").value;
    const err = validate(a);
    if (err) { msg.textContent = "⚠ " + err; msg.className = "hack-msg err"; return; }

    msg.textContent = "⏳ Saving to cloud...";
    msg.className = "hack-msg";

    try {
      if (window.SNAC_FB) {
        await window.SNAC_FB.fbSaveAnime(a);
      }
      msg.textContent = editId ? "✓ UPDATED (cloud synced)" : "✓ ENTRY ADDED (cloud synced)";
      msg.className = "hack-msg ok";
      resetForm();
      await loadFromFirebase();
      setTimeout(() => { msg.textContent = ""; }, 2500);
    } catch (err) {
      console.error(err);
      msg.textContent = "⚠ Cloud save failed — check internet";
      msg.className = "hack-msg err";
    }
  }

  async function deleteAnime(id) {
    if (!confirm("Delete this anime entry?")) return;
    try {
      if (window.SNAC_FB) {
        await window.SNAC_FB.fbDeleteAnime(id);
      }
      toast("🗑 DELETED");
      await loadFromFirebase();
    } catch (err) {
      console.error(err);
      toast("⚠ Delete failed");
    }
  }

  function renderList() {
    const listEl = $("#adminList");
    if (!listEl) return;
    const q = ($("#adminSearch")?.value || "").toLowerCase().trim();
    let all = _listCache.slice();
    if (q) {
      all = all.filter((a) => (a.title || "").toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || (a.titleBn || "").toLowerCase().includes(q));
    }
    all.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    listEl.innerHTML = "";
    if (!all.length) {
      listEl.innerHTML = `<div style="text-align:center;color:var(--hack-dim);padding:20px;font-size:0.75rem;letter-spacing:1px;">// NO ENTRIES FOUND</div>`;
      return;
    }
    all.forEach((a) => {
      const item = document.createElement("div");
      item.className = "hack-item";
      item.innerHTML = `<span class="ai-badge custom">CLOUD</span><div style="flex:1;min-width:0;"><div class="ai-title">${escapeHtml(a.title)}</div><div class="ai-meta">${escapeHtml(a.id)} • ${a.year} • ${escapeHtml(a.status || "")}${a.poster ? " 🖼" : ""}</div></div><button data-act="edit" title="Edit">✏</button><button data-act="del" class="del" title="Delete">🗑</button>`;
      item.querySelector('[data-act="edit"]').addEventListener("click", () => fillForm(a));
      item.querySelector('[data-act="del"]').addEventListener("click", () => deleteAnime(a.id));
      listEl.appendChild(item);
    });
  }

  async function loadFromFirebase() {
    if (!window.SNAC_FB) {
      renderList();
      return;
    }
    try {
      const fromCloud = await window.SNAC_FB.fbGetAllAnime();
      _listCache = Array.isArray(fromCloud) ? fromCloud : [];
      renderList();
    } catch (e) {
      console.error(e);
      renderList();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (isAuthed()) showPanel();
    $("#loginBtn").addEventListener("click", () => {
      const pass = $("#adminPass").value;
      if (login(pass)) showPanel();
      else { $("#loginMsg").textContent = "✗ ACCESS DENIED — WRONG KEY"; $("#loginMsg").className = "hack-msg err"; }
    });
    $("#adminPass").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#loginBtn").click(); });
    $("#animeForm").addEventListener("submit", saveAnime);
    $("#resetBtn").addEventListener("click", resetForm);
    $("#logoutBtn").addEventListener("click", logout);
    $("#adminSearch").addEventListener("input", renderList);
  });
})();