// ===== Rediscover Build Generator 2.0 (safe version) =====
let rules = null;

// bust some stale caches for the JSON at least
(async function init() {
  try {
    const res = await fetch("gearRules.json", { cache: "no-store" });
    rules = await res.json();
  } catch (e) {
    const el = document.getElementById("atkspd");
    if (el) el.innerText = "Failed to load rules: " + e.message;
  }
})();

// Fury multipliers from in-game tooltips
// Lv10 = 4.00x, Lv13 = 4.54x. Interpolated 11/12.
const furyMultipliers = { 10: 4.00, 11: 4.20, 12: 4.37, 13: 4.54 };

// helpers
const pct = id => {
  const v = parseFloat(document.getElementById(id).value);
  return isNaN(v) ? 0 : v / 100;
};
const frac = id => {
  const v = parseFloat(document.getElementById(id).value);
  return isNaN(v) ? 0 : v; // these selects already store 0..0.30 etc.
};

function calculate() {
  try {
    if (!rules) {
      document.getElementById("atkspd").innerText = "Loading rules… try again.";
      return;
    }

    const cls      = document.getElementById("cls").value;
    const baseInfo = rules.baseSpeeds[cls];
    if (!baseInfo || typeof baseInfo.Normal !== "number") {
      throw new Error("Base speed not found for " + cls);
    }
    const base = baseInfo.Normal;

    // inputs
    const statColor = frac("statColor");
    const char      = frac("char");
    const guild     = pct("guild");
    const secret    = pct("secret");
    const equip     = pct("equip");
    const rune      = pct("rune");
    const pet       = pct("pet");
    const quicken   = pct("quicken");
    const furyLvl   = parseInt(document.getElementById("fury").value) || 0;

    // Total ATK SPD bonus (fractions)
    const atkSpdBonus = statColor + char + guild + secret + equip + rune + pet;

    // Attack speed time
    let atkSpdTime;
    if (furyLvl > 0 && furyMultipliers[furyLvl]) {
      // When Fury is active, use the in-game multiplier
      atkSpdTime = base * (1 - atkSpdBonus) / furyMultipliers[furyLvl];
    } else {
      // No Fury → old behavior; quicken is multiplicative time reducer
      atkSpdTime = base * (1 - atkSpdBonus) * (1 - quicken);
    }
    if (!isFinite(atkSpdTime)) throw new Error("Invalid ASPD math");

    const atkCap  = rules.caps.atkSpd;
    const atkOK   = atkSpdTime <= atkCap;

    // Crit/Evasion check vs equipment+rune caps only (your rulebook)
    const critCap = rules.caps.critChance;
    const evaCap  = rules.caps.evasion;
    const critEq  = equip + rune;
    const evaEq   = equip + rune;

    // output
// --- Attack Speed ---
const atkCap  = rules.caps.atkSpd;   // 0.25
const atkOK   = atkSpdTime <= atkCap;
const shownSpd = atkOK ? atkCap : atkSpdTime;

document.getElementById("atkspd").innerText =
  `Attack Speed: ${shownSpd.toFixed(3)}s (${atkOK ? "OK" : "Not capped"})` +
  (atkOK && atkSpdTime < atkCap ? ` [Waste ${( (atkCap - atkSpdTime) / atkCap * 100 ).toFixed(1)}%]` : "") +
  (furyLvl > 0 ? ` [Fury ×${furyMultipliers[furyLvl].toFixed(2)}]` : "");

// --- Crit Chance ---
const critCap = rules.caps.critChance;
const critEq  = equip + rune; // equipment+rune only, per your rulebook
const critWaste = critEq > critCap ? (critEq - critCap) * 100 : 0;
const shownCrit = critEq > critCap ? critCap : critEq;

document.getElementById("crit").innerText =
  `Crit Chance: ${(shownCrit * 100).toFixed(1)}% (cap ${critCap * 100}%)` +
  (critEq >= critCap ? " (OK" + (critWaste > 0 ? `, waste ${critWaste.toFixed(1)}%)` : ")") : "");

// --- Evasion ---
const evaCap = rules.caps.evasion;
const evaEq  = equip + rune;
const evaWaste = evaEq > evaCap ? (evaEq - evaCap) * 100 : 0;
const shownEva = evaEq > evaCap ? evaCap : evaEq;

document.getElementById("evasion").innerText =
  `Evasion: ${(shownEva * 100).toFixed(1)}% (cap ${evaCap * 100}%)` +
  (evaEq >= evaCap ? " (OK" + (evaWaste > 0 ? `, waste ${evaWaste.toFixed(1)}%)` : ")") : "");
}
