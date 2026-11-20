/*
 * ONE place where every form submission goes.
 *
 * FORMSPREE_ID: paste the Formspree form ID here (e.g. "xyzabcd") and every
 * sign-up is emailed to you and stored in Formspree. While it is empty the
 * site only logs sign-ups to the browser console. NOTHING IS SAVED.
 *
 * Later, swap the body of submitLead() for the JobAdder connection.
 * type: "venue" | "talent" | "contact"
 * CV uploads (talent forms) are sent as files; Formspree only accepts files on a paid plan.
 */
const FORMSPREE_ID = "";

window.submitLead = async function submitLead(type, data, form) {
  if (!FORMSPREE_ID) {
    console.warn("[Get Butter] FORMSPREE_ID not set. Sign-up NOT saved:", type, data);
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true };
  }
  const subject = `New ${type} sign-up: ${data.name || ""}`;
  const fileInput = form && form.querySelector('input[type="file"]');
  let res;
  if (fileInput && fileInput.files.length) {
    // CV attached: send as a file upload (needs a Formspree plan that accepts files)
    const fd = new FormData(form);
    fd.append("type", type);
    fd.append("_subject", subject);
    res = await fetch("https://formspree.io/f/" + FORMSPREE_ID, { method: "POST", headers: { Accept: "application/json" }, body: fd });
  } else {
    const clean = {};
    Object.keys(data).forEach((k) => { if (data[k] === null || typeof data[k] !== "object") clean[k] = data[k]; });
    res = await fetch("https://formspree.io/f/" + FORMSPREE_ID, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ type, _subject: subject, ...clean }),
    });
  }
  if (!res.ok) throw new Error("Submit failed: " + res.status);
  return { ok: true };
};
