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
    const statColor = parseFloat(document.getElementById("statColor").value) || 0;
    const char      = parseFloat(document.getElementById("char").value) || 0;
    const guild     = parseFloat(document.getElementById("guild").value) / 100 || 0;
    const secret    = parseFloat(document.getElementById("secret").value) / 100 || 0;
    const equip     = parseFloat(document.getElementById("equip").value) / 100 || 0;
    const rune      = parseFloat(document.getElementById("rune").value) / 100 || 0;
    const pet       = parseFloat(document.getElementById("pet").value) / 100 || 0;
    const quicken   = parseFloat(document.getElementById("quicken").value) / 100 || 0;
    const furyLvl   = parseInt(document.getElementById("fury").value) || 0;

    // total ATK SPD bonus (fraction)
    const atkSpdBonus = statColor + char + guild + secret + equip + rune + pet;

    // fury multipliers
    const furyMultipliers = { 10: 4.00, 11: 4.20, 12: 4.37, 13: 4.54 };

    // attack speed time
    let atkSpdTime;
    if (furyLvl > 0 && furyMultipliers[furyLvl]) {
      atkSpdTime = base * (1 - atkSpdBonus) / furyMultipliers[furyLvl];
    } else {
     atkSpdTime = base * (1 - atkSpdBonus) / (1 + quicken);
    }

    // --- Attack Speed ---
    const atkCap  = rules.caps.atkSpd;   // 0.25
    const atkOK   = atkSpdTime <= atkCap;
    const atkWaste = atkOK ? ((atkCap - atkSpdTime) / atkCap * 100) : 0;
    const shownSpd = atkOK ? atkCap : atkSpdTime;

    document.getElementById("atkspd").innerText =
      `Attack Speed: ${shownSpd.toFixed(3)}s (${atkOK ? "OK" : "Not capped"})` +
      (atkOK && atkWaste > 0.1 ? ` [Waste ${atkWaste.toFixed(1)}%]` : "") +
      (furyLvl > 0 ? ` [Fury ×${furyMultipliers[furyLvl].toFixed(2)}]` : "");

    // --- Crit Chance ---
    const critCap = rules.caps.critChance; // 0.5
    const critEq  = equip + rune;
    const critWaste = critEq > critCap ? (critEq - critCap) * 100 : 0;
    const shownCrit = critEq > critCap ? critCap : critEq;

    document.getElementById("crit").innerText =
      `Crit Chance: ${(shownCrit * 100).toFixed(1)}% (cap ${critCap * 100}%)` +
      (critEq >= critCap ? (critWaste > 0 ? ` [Waste ${critWaste.toFixed(1)}%]` : " [OK]") : "");

    // --- Evasion ---
    const evaCap = rules.caps.evasion; // 0.4
    const evaEq  = equip + rune;
    const evaWaste = evaEq > evaCap ? (evaEq - evaCap) * 100 : 0;
    const shownEva = evaEq > evaCap ? evaCap : evaEq;

    document.getElementById("evasion").innerText =
      `Evasion: ${(shownEva * 100).toFixed(1)}% (cap ${evaCap * 100}%)` +
      (evaEq >= evaCap ? (evaWaste > 0 ? ` [Waste ${evaWaste.toFixed(1)}%]` : " [OK]") : "");

  } catch (err) {
    document.getElementById("atkspd").innerText = "Calc error: " + err.message;
  }
}
