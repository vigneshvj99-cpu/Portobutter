/*
 * ONE place where every form submission goes.
 *
 * FORMSPREE_ID: paste the Formspree form ID here (e.g. "xyzabcd") and every
 * sign-up is emailed to you and stored in Formspree. While it is empty the
 * site only logs sign-ups to the browser console. NOTHING IS SAVED.
 *
 * Later, swap the body of submitLead() for the JobAdder connection.
 * type: "venue" | "talent"
 */
const FORMSPREE_ID = "";

window.submitLead = async function submitLead(type, data) {
  if (!FORMSPREE_ID) {
    console.warn("[Get Butter] FORMSPREE_ID not set. Sign-up NOT saved:", type, data);
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true };
  }
  const res = await fetch("https://formspree.io/f/" + FORMSPREE_ID, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ type, _subject: `New ${type} sign-up: ${data.name || ""}`, ...data }),
  });
  if (!res.ok) throw new Error("Submit failed: " + res.status);
  return { ok: true };
};
