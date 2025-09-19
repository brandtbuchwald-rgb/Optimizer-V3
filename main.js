// ===== Rediscover Build Generator 2.0 (safe version) =====
let rules;

async function loadRules() {
  try {
    const res = await fetch("gearRules.json", { cache: "no-store" });
    rules = await res.json();
  } catch (e) {
    document.getElementById("atkspd").innerText = "Failed to load rules.";
  }
}
loadRules();

// Fury multipliers (from in-game tooltips)
const furyMultipliers = { 10: 4.00, 11: 4.20, 12: 4.37, 13: 4.54 };

function calculate() {
  try {
    if (!rules) {
      document.getElementById("atkspd").innerText = "Rules not loaded yet!";
      return;
    }

    const cls      = document.getElementById("cls").value;
    const baseInfo = rules.baseSpeeds[cls];
    const base     = baseInfo.Normal;

    // Inputs
    const statColor = parseFloat(document.getElementById("statColor").value) || 0;
    const char      = parseFloat(document.getElementById("char").value) || 0;
    const guild     = (parseFloat(document.getElementById("guild").value) || 0) / 100;
    const secret    = (parseFloat(document.getElementById("secret").value) || 0) / 100;
    const equip     = (parseFloat(document.getElementById("equip").value) || 0) / 100;
    const rune      = (parseFloat(document.getElementById("rune").value) || 0) / 100;
    const pet       = (parseFloat(document.getElementById("pet").value) || 0) / 100;
    const quicken   = (parseFloat(document.getElementById("quicken").value) || 0) / 100;

    const critGear  = (parseFloat(document.getElementById("critGear").value) || 0) / 100;
    const critRune  = (parseFloat(document.getElementById("critRune").value) || 0) / 100;
    const evaGear   = (parseFloat(document.getElementById("evaGear").value) || 0) / 100;
    const evaRune   = (parseFloat(document.getElementById("evaRune").value) || 0) / 100;

    const furyLvl   = parseInt(document.getElementById("fury").value) || 0;

    // Total ATK SPD bonus
    const atkSpdBonus = statColor + char + guild + secret + equip + rune + pet;

    // ASPD formula
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
    const critTotal = critGear + critRune;
    const critWaste = critTotal > critCap ? (critTotal - critCap) * 100 : 0;
    const shownCrit = critTotal > critCap ? critCap : critTotal;

    document.getElementById("crit").innerText =
      `Crit Chance: ${(shownCrit * 100).toFixed(1)}% (cap ${critCap * 100}%)` +
      (critTotal >= critCap ? (critWaste > 0 ? ` [Waste ${critWaste.toFixed(1)}%]` : " [OK]") : "");

    // --- Evasion ---
    const evaCap = rules.caps.evasion; // 0.4
    const evaTotal = evaGear + evaRune;
    const evaWaste = evaTotal > evaCap ? (evaTotal - evaCap) * 100 : 0;
    const shownEva = evaTotal > evaCap ? evaCap : evaTotal;

    document.getElementById("evasion").innerText =
      `Evasion: ${(shownEva * 100).toFixed(1)}% (cap ${evaCap * 100}%)` +
      (evaTotal >= evaCap ? (evaWaste > 0 ? ` [Waste ${evaWaste.toFixed(1)}%]` : " [OK]") : "");

  } catch (err) {
    document.getElementById("atkspd").innerText = "Calc error: " + err.message;
  }
}
