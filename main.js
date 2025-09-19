let rules;

async function loadRules() {
  const res = await fetch("gearRules.json", { cache: "no-store" });
  rules = await res.json();
}
loadRules();

const furyMultipliers = { 10: 4.00, 11: 4.20, 12: 4.37, 13: 4.54 };

// slot rules + priorities (simplified for now)
const slotRules = {
  Weapon:   { allowed: ["ATK%", "Crit DMG"], purple: null },
  Helm:     { allowed: ["ATK SPD", "Crit Chance", "Evasion"], purple: "HP%" },
  Chest:    { allowed: ["ATK SPD", "Crit Chance", "Evasion", "ATK%"], purple: "ATK%" },
  Gloves:   { allowed: ["ATK SPD", "Crit Chance", "Evasion", "Crit DMG"], purple: "ATK%" },
  Boots:    { allowed: ["ATK SPD", "Crit Chance", "Evasion"], purple: "ATK%" },
  Belt:     { allowed: ["ATK SPD", "Crit Chance", "Evasion"], purple: "HP%" },
  Necklace: { allowed: ["Crit Chance", "ATK%", "Crit DMG"], purple: "Crit DMG" },
  Ring:     { allowed: ["Crit Chance", "ATK%", "Crit DMG"], purple: "Crit DMG" }
};

const priorities = {
  DPS:  ["ATK SPD", "Crit Chance", "Evasion", "ATK%", "Crit DMG", "HP%", "DEF%", "DR"],
  Tank: ["ATK SPD", "Evasion", "Crit Chance", "DR", "HP%", "DEF%", "ATK%", "Crit DMG"]
};

function calculate() {
  if (!rules) { alert("Rules not loaded yet"); return; }

  const cls   = document.getElementById("cls").value;
  const focus = document.getElementById("focus").value;
  const base  = rules.baseSpeeds[cls].Normal;

  const statColor = parseFloat(document.getElementById("statColor").value) || 0;
  const char      = parseFloat(document.getElementById("char").value) || 0;

  const guild     = (parseFloat(document.getElementById("guild").value)  || 0) / 100;
  const secret    = (parseFloat(document.getElementById("secret").value) || 0) / 100;
  const pet       = (parseFloat(document.getElementById("pet").value)    || 0) / 100;
  const quicken   = (parseFloat(document.getElementById("quicken").value)|| 0) / 100;

  const gearAtkSpd = (parseFloat(document.getElementById("equipAtkSpd").value) || 0) / 100;
  const gearCrit   = (parseFloat(document.getElementById("equipCrit").value)   || 0) / 100;
  const gearEva    = (parseFloat(document.getElementById("equipEva").value)    || 0) / 100;

  const runeAtkSpd = (parseFloat(document.getElementById("runeAtkSpd").value) || 0) / 100;
  const runeCrit   = (parseFloat(document.getElementById("runeCrit").value)   || 0) / 100;
  const runeEva    = (parseFloat(document.getElementById("runeEva").value)    || 0) / 100;

  const furyLvl = parseInt(document.getElementById("fury").value) || 0;

  // ATK SPD total includes everything
  const atkSpdBonus = statColor + char + guild + secret + gearAtkSpd + runeAtkSpd + pet;
  let atkSpdTime;
  if (furyLvl > 0 && furyMultipliers[furyLvl]) {
    atkSpdTime = base * (1 - atkSpdBonus) / furyMultipliers[furyLvl];
  } else {
    atkSpdTime = base * (1 - atkSpdBonus) / (1 + quicken);
  }

  // crit/eva gear+rune only
  const critTotal = gearCrit + runeCrit;
  const evaTotal  = gearEva + runeEva;

  // --- Results ---
  const atkCap = rules.caps.atkSpd;
  const atkOK  = atkSpdTime <= atkCap;
  const shownSpd = atkOK ? atkCap : atkSpdTime;
  document.getElementById("atkspd").innerText =
    `Attack Speed: ${shownSpd.toFixed(3)}s (${atkOK ? "OK" : "Not capped"})`;

  const critCap = rules.caps.critChance;
  const critWaste = critTotal > critCap ? (critTotal - critCap) * 100 : 0;
  const shownCrit = critTotal > critCap ? critCap : critTotal;
  document.getElementById("crit").innerText =
    `Crit: ${(shownCrit*100).toFixed(1)}% / ${critCap*100}% cap` +
    (critWaste > 0 ? ` [Waste ${critWaste.toFixed(1)}%]` : "");

  const evaCap = rules.caps.evasion;
  const evaWaste = evaTotal > evaCap ? (evaTotal - evaCap) * 100 : 0;
  const shownEva = evaTotal > evaCap ? evaCap : evaTotal;
  document.getElementById("evasion").innerText =
    `Evasion: ${(shownEva*100).toFixed(1)}% / ${evaCap*100}% cap` +
    (evaWaste > 0 ? ` [Waste ${evaWaste.toFixed(1)}%]` : "");

  // --- Progress bars ---
  document.getElementById("atkBar").style.width  = Math.min((shownSpd/atkCap)*100, 100) + "%";
  document.getElementById("critBar").style.width = Math.min((critTotal/critCap)*100, 100) + "%";
  document.getElementById("evaBar").style.width  = Math.min((evaTotal/evaCap)*100, 100) + "%";

  // --- Build gear layout ---
  const { layout, totals } = buildLayout(cls, focus, { atkSpd: atkSpdBonus, crit: critTotal, eva: evaTotal });
  let text = `Optimal Layout (${cls} — ${focus}):\n`;
  for (let slot in layout) {
    text += `• ${slot}: ${layout[slot]}\n`;
  }
  document.getElementById("layoutText").innerText = text;
}

// === Layout logic ===
function buildLayout(cls, focus, currentStats) {
  const prio = priorities[focus];
  const layout = {};
  let totals = { ...currentStats };

  const caps = {
    "ATK SPD": rules.caps.atkSpd,
    "Crit Chance": rules.caps.critChance,
    "Evasion": rules.caps.evasion
  };

  const slotLocks = {};

  for (let slot in slotRules) {
    const rules = slotRules[slot];
    const stats = [];

    for (let stat of prio) {
      if (!rules.allowed.includes(stat)) continue;
      if (stat in caps && totals[stat] >= caps[stat]) continue;
      if (slotLocks[slot]) continue;

      stats.push(stat);
      slotLocks[slot] = stat;

      if (stat === "ATK SPD") totals[stat] += 0.10;
      if (stat === "Crit Chance") totals[stat] += 0.10;
      if (stat === "Evasion") totals[stat] += 0.10;

      if (stats.length >= 3) break;
    }

    if (rules.purple) stats.push(`(5th: ${rules.purple})`);
    layout[slot] = stats.join(", ");
  }

  return { layout, totals };
}
