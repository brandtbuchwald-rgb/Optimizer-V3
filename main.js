let rules;

async function loadRules() {
  try {
    const res = await fetch("gearRules.json");
    rules = await res.json();
    console.log("Rules loaded:", rules);
  } catch (err) {
    console.error("Failed to load gearRules.json", err);
  }
}
loadRules();

// Fury denominator constants
// Fury multipliers from in-game tooltip
const furyMultipliers = {
  10: 4.00,
  11: 4.20,
  12: 4.37,
  13: 4.54
};

if (furyLvl > 0 && furyMultipliers[furyLvl]) {
  atkSpdTime = base * (1 - atkSpdBonus) / furyMultipliers[furyLvl];
} else {
  atkSpdTime = base * (1 - atkSpdBonus) * (1 - quicken);
}

function calculate() {
  if (!rules) {
    alert("Rules not loaded yet! Try again in a second.");
    return;
  }

  const cls = document.getElementById("cls").value;
  const statColor = parseFloat(document.getElementById("statColor").value);
  const char = parseFloat(document.getElementById("char").value);
  const guild = parseFloat(document.getElementById("guild").value) / 100;
  const secret = parseFloat(document.getElementById("secret").value) / 100;
  const equip = parseFloat(document.getElementById("equip").value) / 100;
  const rune = parseFloat(document.getElementById("rune").value) / 100;
  const pet = parseFloat(document.getElementById("pet").value) / 100;
  const quicken = parseFloat(document.getElementById("quicken").value) / 100;
  const furyLvl = parseInt(document.getElementById("fury").value);

  const base = rules.baseSpeeds[cls].Normal;

  // Total ATK SPD Bonus (fraction, not percent)
  const atkSpdBonus = statColor + char + guild + secret + equip + rune + pet;

  // Quicken trait (e.g. 3% quicken = 1.03)
  const quickenTrait = 1 + quicken;

  let atkSpdTime;

  if (furyLvl > 0 && furyDenoms[furyLvl]) {
    // ASPD with Fury formula
    atkSpdTime = base * (1 - atkSpdBonus) /
      (furyDenoms[furyLvl] + (quickenTrait - 1));
  } else {
    // Normal formula
    atkSpdTime = base * (1 - atkSpdBonus) * (1 - quicken);
  }

  const atkSpdGoal = rules.caps.atkSpd;
  const atkSpdOK = atkSpdTime <= atkSpdGoal;

  document.getElementById("atkspd").innerText =
    `Attack Speed: ${atkSpdTime.toFixed(3)}s (${atkSpdOK ? "OK" : "Not capped"})` +
    (furyLvl > 0 ? ` [Fury Lv.${furyLvl}]` : "");

  // Crit
  let crit = equip + rune;
  const critCap = rules.caps.critChance;
  let critDisplay = `Crit Chance: ${(crit * 100).toFixed(1)}% (cap ${critCap * 100}%)`;
  if (crit > critCap) critDisplay += " [Overcapped]";
  document.getElementById("crit").innerText = critDisplay;

  // Evasion
  let evasion = equip + rune;
  const evasionCap = rules.caps.evasion;
  let evaDisplay = `Evasion: ${(evasion * 100).toFixed(1)}% (cap ${evasionCap * 100}%)`;
  if (evasion > evasionCap) evaDisplay += " [Overcapped]";
  document.getElementById("evasion").innerText = evaDisplay;
}
