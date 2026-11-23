/*
 * ONE place where every form submission goes.
 *
 * Every enquiry is emailed to FORM_TO through FormSubmit (formsubmit.co).
 * The very first submission makes FormSubmit send an "Activate form" email to
 * that inbox; nothing is delivered until the link in it is clicked once.
 * After activation, FormSubmit gives a private code: put it in FORM_TO in
 * place of the email address so the address is not visible in the page.
 *
 * type: "venue" | "talent" | "contact"
 * Forms with a CV attached are sent as a normal upload (FormSubmit only
 * accepts files that way), then FormSubmit sends the visitor to thanks.html.
 */
const FORM_TO = "sean@getbutter.co.uk";

const SUBJECTS = {
  venue: (d) => `New Find talent enquiry: ${d.name || ""}${d.venue ? ", " + d.venue : ""}`,
  talent: (d) => `New talent registration: ${d.name || ""}${d.role ? ", " + d.role : ""}`,
  contact: (d) => `New contact message: ${d.name || ""}`,
};

function gbAutoReply(type, data) {
  const first = ((data.name || "").trim().split(/\s+/)[0] || "").replace(/[^\p{L}\p{M}'\-]/gu, "");
  const what = type === "talent" ? "registration" : "enquiry";
  return `Hi ${first || "there"},\n\nThanks for getting in touch with Butter.\nWe've received your ${what} and will get back to you soon.\n\nThe Butter team · getbutter.co.uk`;
}

function gbSubject(type, data) {
  return (SUBJECTS[type] || ((d) => `New ${type} enquiry: ${d.name || ""}`))(data);
}

window.submitLead = async function submitLead(type, data, form) {
  if (!FORM_TO) {
    console.warn("[Butter] FORM_TO not set. Enquiry NOT sent:", type, data);
    return { ok: true };
  }
  const subject = gbSubject(type, data);
  const fileInput = form && form.querySelector('input[type="file"]');

  if (fileInput && fileInput.files.length) {
    // CV or job spec attached: real form upload so the file arrives as an attachment.
    try {
      sessionStorage.setItem("gb_name", (data.name || "").trim().split(/\s+/)[0] || "");
      sessionStorage.setItem("gb_email", data.email || "");
      sessionStorage.setItem("gb_type", type);
    } catch (_) {}
    const add = (name, value) => {
      let el = form.querySelector(`input[type="hidden"][name="${name}"]`);
      if (!el) { el = document.createElement("input"); el.type = "hidden"; el.name = name; form.appendChild(el); }
      el.value = value;
    };
    add("_subject", subject);
    add("_template", "table");
    add("_captcha", "false");
    add("form", type);
    if (data.email) { add("_replyto", data.email); add("_autoresponse", gbAutoReply(type, data)); }
    add("_next", new URL("thanks.html", location.href).href);
    form.action = "https://formsubmit.co/" + FORM_TO;
    form.method = "POST";
    form.enctype = "multipart/form-data";
    HTMLFormElement.prototype.submit.call(form);
    await new Promise(() => {}); // the page is leaving; keep the button in its sending state
  }

  const body = { _subject: subject, _template: "table", form: type };
  Object.keys(data).forEach((k) => {
    const v = data[k];
    if (v === null || typeof v !== "object") body[k] = v;
  });
  if (data.email) { body._replyto = data.email; body._autoresponse = gbAutoReply(type, data); }
  const res = await fetch("https://formsubmit.co/ajax/" + FORM_TO, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Submit failed: " + res.status);
  const out = await res.json().catch(() => ({}));
  if (out && out.success === "false") throw new Error(out.message || "Submit failed");
  return { ok: true };
};
