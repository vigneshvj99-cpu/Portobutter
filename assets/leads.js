/*
 * ONE place where every form submission goes.
 *
 * Prototype: logs the data and pretends it worked.
 * When the CRM is confirmed, replace the body of submitLead() with the
 * CRM call (API, webhook or Zapier URL). Nothing else on the site needs
 * to change.
 *
 * type: "venue" | "talent" | "application"
 */
window.submitLead = async function submitLead(type, data) {
  // TODO(CRM): send to the CRM here, e.g.
  // await fetch(CRM_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, ...data }) });
  console.log("[Get Butter] new lead", type, data);
  await new Promise((r) => setTimeout(r, 600)); // simulate network
  return { ok: true };
};
