let rules;

async function loadRules() {
  const res = await fetch("gearRules.json");
  rules = await res.json();
}
loadRules();

function calculate() {
  const cls = document.getElementById("cls").value;
  const focus = document.getElementById("focus").value;
  const statColor = parseFloat(document.getElementById("statColor").value);
  const char = parseFloat(document.getElementById("char").value);
  const guild = parseFloat(document.getElementById("guild").value) / 100;
  const secret = parseFloat(document.getElementById("secret").value) / 100;
  const equip = parseFloat(document.getElementById("equip").value) / 100;
  const rune = parseFloat(document.getElementById("rune").value) / 100;
  const pet = parseFloat(document.getElementById("pet").value) / 100;
  const quicken = parseFloat(document.getElementById("quicken").value) / 100;

  const base = rules.baseSpeeds[cls].Normal;

  // Attack speed calculation
  // Fury constants (approximate values from testing)
const furyDenoms = {
  10: 2.38,
  11: 2.35,
  12: 2.31,
  13: 2.28
};

function calculate() {
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

  // Total ATK SPD Bonus (as fraction, not %)
  const atkSpdBonus = statColor + char + guild + secret + equip + rune + pet;

  // Quicken trait = 1 + quicken%
  const quickenTrait = 1 + quicken;

  let atkSpdTime;
  if (furyLvl > 0 && furyDenoms[furyLvl]) {
    // Formula with Fury
    atkSpdTime = base * (1 - atkSpdBonus) / (furyDenoms[furyLvl] + (quickenTrait - 1));
  } else {
    // Normal formula (no Fury)
    atkSpdTime = base * (1 - atkSpdBonus) * (1 - quicken);
  }

  const atkSpdGoal = rules.caps.atkSpd;
  const atkSpdOK = atkSpdTime <= atkSpdGoal;

  document.getElementById("atkspd").innerText =
    `Attack Speed: ${atkSpdTime.toFixed(3)}s (${atkSpdOK ? "OK" : "Not capped"})` +
    (furyLvl > 0 ? ` [Fury Lv.${furyLvl}]` : "");
}
  const atkSpdGoal = rules.caps.atkSpd;
  const atkSpdOK = atkSpdTime <= atkSpdGoal;

  document.getElementById("atkspd").innerText =
    `Attack Speed: ${atkSpdTime.toFixed(2)}s (${atkSpdOK ? "OK" : "Not capped"})`;

  // Crit chance
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
