(function () {
  "use strict";

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------- forms ---------- */
  function setError(field, msg) {
    const wrap = field.closest(".field") || field.closest(".check");
    if (!wrap) return;
    wrap.classList.toggle("invalid", !!msg);
    let err = wrap.querySelector(".error");
    if (!err) {
      err = document.createElement("div");
      err.className = "error";
      err.setAttribute("role", "alert");
      wrap.appendChild(err);
    }
    err.textContent = msg || "";
    field.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function validate(form) {
    let firstBad = null;
    form.querySelectorAll("input, select, textarea").forEach((el) => {
      let msg = "";
      if (el.type === "checkbox") {
        if (el.required && !el.checked) msg = "Please tick to continue.";
      } else if (el.type === "file") {
        if (el.required && !el.files.length) msg = "Please add your CV.";
        else if (el.files.length) {
          const f = el.files[0];
          if (!/\.(pdf|docx?)$/i.test(f.name)) msg = "CV must be a PDF or Word file.";
          else if (f.size > 5 * 1024 * 1024) msg = "CV must be under 5MB.";
        }
      } else {
        const v = el.value.trim();
        if (el.required && !v) msg = "Required.";
        else if (el.type === "email" && v && !EMAIL_RE.test(v)) msg = "Enter a valid email.";
        else if (el.type === "tel" && v && v.replace(/\D/g, "").length < 10) msg = "Enter a valid phone number.";
      }
      setError(el, msg);
      if (msg && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  document.querySelectorAll("form[data-lead]").forEach((form) => {
    form.noValidate = true;
    form.addEventListener("input", (e) => {
      if (e.target.closest(".invalid")) setError(e.target, "");
    });
    form.addEventListener("change", (e) => {
      if (e.target.type === "file") {
        const label = form.querySelector("[data-file-label]");
        if (label) label.textContent = e.target.files.length ? e.target.files[0].name : "Upload your CV";
      }
      if (e.target.closest(".invalid")) setError(e.target, "");
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate(form)) return;
      const btn = form.querySelector("button[type=submit]");
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending…";
      const data = {};
      new FormData(form).forEach((v, k) => {
        data[k] = v instanceof File ? (v.name ? { name: v.name, size: v.size, type: v.type } : null) : v;
      });
      try {
        await window.submitLead(form.dataset.lead, data);
        try {
          sessionStorage.setItem("gb_name", (data.name || "").trim().split(/\s+/)[0] || "");
          sessionStorage.setItem("gb_email", data.email || "");
          sessionStorage.setItem("gb_type", form.dataset.lead);
        } catch (_) {}
        window.location.href = "thanks.html";
      } catch (err) {
        btn.disabled = false;
        btn.textContent = label;
        alert("Sorry, something went wrong. Please try again.");
      }
    });
  });

  /* ---------- talent form: "Other" role makes the free-text box required ---------- */
  const roleSel = document.getElementById("t-role");
  const otherInput = document.getElementById("t-other");
  const otherLabel = document.querySelector("[data-other-label]");
  if (roleSel && otherInput && otherLabel) {
    const syncOther = () => {
      const isOther = roleSel.value === "Other";
      otherInput.required = isOther;
      otherLabel.textContent = isOther ? "Tell us your role" : "Other roles you do (optional)";
      otherInput.placeholder = isOther ? "e.g. sommelier, events coordinator…" : "e.g. barista, events, hotel reception…";
      if (!isOther) setError(otherInput, "");
    };
    roleSel.addEventListener("change", syncOther);
    syncOther();
  }

  /* ---------- thanks page ---------- */
  const thanksName = document.querySelector("[data-thanks-name]");
  if (thanksName) {
    let name = "", email = "", type = "";
    try {
      name = sessionStorage.getItem("gb_name") || "";
      email = sessionStorage.getItem("gb_email") || "";
      type = sessionStorage.getItem("gb_type") || "";
    } catch (_) {}
    thanksName.textContent = name ? `Nice one, ${name}.` : "Nice one.";
    const body = document.querySelector("[data-thanks-body]");
    if (body) {
      const sent = email ? `We'll be in touch at <strong>${esc(email)}</strong>. ` : "";
      const msg =
        type === "venue"
          ? "When we open the doors you'll be first in line for vetted hospitality talent."
          : type === "application"
          ? "Your application is in. We'll review it and get back to you soon."
          : "When we open the doors you'll be first to hear about roles at places worth working for.";
      body.innerHTML = sent + msg;
    }
    const share = document.querySelector("[data-share]");
    if (share) {
      share.addEventListener("click", async () => {
        const url = new URL("index.html", location.href).href;
        try {
          if (navigator.share) await navigator.share({ title: "Get Butter", text: "Hospitality recruitment, launching soon.", url });
          else {
            await navigator.clipboard.writeText(url);
            share.textContent = "Link copied";
          }
        } catch (_) {}
      });
    }
  }

  /* ---------- jobs list ---------- */
  const grid = document.querySelector("[data-job-grid]");
  if (grid && window.JOBS) {
    const q = document.getElementById("f-q");
    const area = document.getElementById("f-area");
    const loc = document.getElementById("f-loc");
    const type = document.getElementById("f-type");
    const count = document.querySelector("[data-job-count]");

    const fill = (sel, values) =>
      [...new Set(values)].sort().forEach((v) => sel.insertAdjacentHTML("beforeend", `<option>${esc(v)}</option>`));
    fill(area, JOBS.map((j) => j.area));
    fill(loc, JOBS.map((j) => j.location));
    fill(type, JOBS.map((j) => j.type));

    const card = (j) => `
      <a class="job${j.featured ? " featured" : ""}" href="job.html?id=${encodeURIComponent(j.id)}">
        <span class="mono meta">${esc(j.area)} · ${esc(j.type)}${j.featured ? " · Featured" : ""}</span>
        <h2>${esc(j.title)}</h2>
        <span class="where">${esc(j.venue)} · ${esc(j.location)}</span>
        <span class="foot"><span class="pay">${esc(j.pay)}</span><span class="view">View →</span></span>
      </a>`;
    const cta = `
      <div class="job-cta">
        <h2>Nothing that fits yet?</h2>
        <p>Join the talent list and we'll match you when the right role lands.</p>
        <a class="mono" href="index.html#talent">Register →</a>
      </div>`;

    function render() {
      const term = q.value.trim().toLowerCase();
      const list = JOBS.filter(
        (j) =>
          (!term || [j.title, j.venue, j.location, j.area].join(" ").toLowerCase().includes(term)) &&
          (!area.value || j.area === area.value) &&
          (!loc.value || j.location === loc.value) &&
          (!type.value || j.type === type.value)
      ).sort((a, b) => b.featured - a.featured);
      grid.innerHTML = (list.length ? list.map(card).join("") : `<p class="empty">No roles match those filters.</p>`) + cta;
      if (count) count.textContent = `${list.length} live role${list.length === 1 ? "" : "s"} · Cotswolds & UK`;
    }
    [q, area, loc, type].forEach((el) => el.addEventListener("input", render));
    render();
  }

  /* ---------- job detail ---------- */
  const detail = document.querySelector("[data-job-detail]");
  if (detail && window.JOBS) {
    const id = new URLSearchParams(location.search).get("id");
    const j = JOBS.find((x) => x.id === id);
    if (!j) {
      detail.innerHTML = `<p class="empty">That role isn't available. <a href="jobs.html" style="color:var(--yellow)">See all jobs</a>.</p>`;
      document.querySelector("[data-apply]")?.remove();
    } else {
      document.title = `${j.title} · ${j.location} · Get Butter`;
      detail.innerHTML = `
        <span class="mono eyebrow">${esc(j.area)} · ${esc(j.type)} · ${esc(j.location)}</span>
        <h1>${esc(j.title)}<span class="dot">.</span></h1>
        <div class="facts">
          <div><span class="mono">Pay</span>${esc(j.pay)}</div>
          <div><span class="mono">Hours</span>${esc(j.hours)}</div>
          <div><span class="mono">Start</span>${esc(j.start)}</div>
        </div>
        <h2>The place</h2><p>${esc(j.venue)}, ${esc(j.location)}. ${esc(j.place)}</p>
        <h2>The role</h2><p>${esc(j.role)}</p>`;
      const hidden = document.getElementById("job-id");
      if (hidden) hidden.value = `${j.id} (${j.title}, ${j.location})`;
    }
  }

  /* ---------- footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
