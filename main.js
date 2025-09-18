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
  const atkSpdPct = statColor + char + guild + secret + equip + rune + pet - quicken;
  const atkSpdTime = base * (1 - atkSpdPct);
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
