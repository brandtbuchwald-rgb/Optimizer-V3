let rules;

const furyX = {10:4.00, 11:4.20, 12:4.37, 13:4.54};
const classes = ["Berserker","Ranger","Paladin","Sorcerer"];

const prioByFocus = {
  DPS:  ["ATK%","Crit DMG","Monster DMG","HP%","DEF%","DR"],
  Tank: ["DR","DEF%","HP%","ATK%","Crit DMG","Monster DMG"]
};

const slotPools = {
  Helm:   ["ATK SPD","Crit Chance","Evasion","HP%","DEF%","DR"],
  Chest:  ["ATK SPD","Crit Chance","Evasion","ATK%","HP%","DEF%"],
  Gloves: ["ATK SPD","Crit Chance","Evasion","Crit DMG","ATK%"],
  Boots:  ["ATK SPD","Crit Chance","Evasion","DEF%","HP%"],
  Belt:   ["ATK SPD","Crit Chance","Evasion","DEF%","DR"],
  Necklace:["Crit Chance","ATK%","Crit DMG"],
  Ring:   ["Crit Chance","ATK%","Crit DMG"]
};

const tierLines = { Primal:3, Original:4, Chaos:4, Abyss:4 };
const q = id => document.getElementById(id);

async function loadRules() {
  const res = await fetch("gearRules.json",{cache:"no-store"});
  rules = await res.json();
  const clsSel = q("cls");
  clsSel.innerHTML = classes.map(c=>`<option>${c}</option>`).join("");
  updateWeaponCats();
  clsSel.addEventListener("change", updateWeaponCats);
  q("calcBtn").addEventListener("click", calculate);
}

function updateWeaponCats() {
  const cls = q("cls").value || classes[0];
  const catSel = q("weaponCat");
  const cats = Object.keys(rules.weapons[cls]);
  catSel.innerHTML = cats.map(n=>`<option>${n}</option>`).join("");
  q("weaponTier").disabled = (cats.length<2);
}
loadRules();

function calculate() {
  const cls = q("cls").value;
  const weaponCat = q("weaponCat").value;
  const weaponTier = q("weaponTier").value;
  const gearTier = q("gearTier").value;
  const focus = q("focus").value;

  const base = rules.weapons[cls][weaponCat];
  const statColor = parseFloat(q("statColor").value)||0;
  const char      = parseFloat(q("char").value)||0;
  const guild     = (parseFloat(q("guild").value)||0)/100;
  const secret    = (parseFloat(q("secret").value)||0)/100;
  const pet       = (parseFloat(q("pet").value)||0)/100;
  const quicken   = (parseFloat(q("quicken").value)||0)/100;

  const gearAtkSpd = (parseFloat(q("equipAtkSpd").value)||0)/100;
  const gearCrit   = (parseFloat(q("equipCrit").value)||0)/100;
  const gearEva    = (parseFloat(q("equipEva").value)||0)/100;

  const runeAtkSpd = (parseFloat(q("runeAtkSpd").value)||0)/100;
  const runeCrit   = (parseFloat(q("runeCrit").value)||0)/100;
  const runeEva    = (parseFloat(q("runeEva").value)||0)/100;

  const furyLvl = parseInt(q("fury").value)||0;

  const atkSpdBonus = statColor+char+guild+secret+gearAtkSpd+runeAtkSpd+pet;
  const critTotal   = gearCrit+runeCrit;
  const evaTotal    = gearEva+runeEva;

  const aspdTime = (total) =>
    furyLvl && furyX[furyLvl] ? base*(1-total)/furyX[furyLvl]
                              : base*(1-total)/(1+quicken);

  const atkTime_now = aspdTime(atkSpdBonus);
  const atkOK_now = atkTime_now <= rules.caps.atkSpd;
  q("atkspd").innerText = `Attack Speed: ${(atkOK_now?rules.caps.atkSpd:atkTime_now).toFixed(3)}s (${atkOK_now?"OK":"Not capped"})`;
  q("atkBar").style.width = Math.min(100, (rules.caps.atkSpd/(atkOK_now?rules.caps.atkSpd:atkTime_now))*100)+"%";

  const critCap = rules.caps.critChance, evaCap = rules.caps.evasion;
  q("crit").innerText = `Crit Chance: ${(Math.min(critCap,critTotal)*100).toFixed(1)}% / ${critCap*100}% cap`;
  q("critBar").style.width = Math.min(100, (critTotal/critCap)*100)+"%";
  q("evasion").innerText = `Evasion: ${(Math.min(evaCap,evaTotal)*100).toFixed(1)}% / ${evaCap*100}% cap`;
  q("evaBar").style.width = Math.min(100, (evaTotal/evaCap)*100)+"%";

  const baseline = {atkSpd:atkSpdBonus,crit:critTotal,eva:evaTotal};
  const layout = buildLayout({cls,focus,weaponCat,weaponTier,gearTier,baseline});
  let out = `Optimal Layout (${cls} — ${focus}, ${weaponCat}${weaponCat.startsWith("Primal")?` / ${weaponTier}`:""})\n`;
  rules.slots.forEach(slot=> out += `• ${slot}: ${layout[slot].join(", ")}\n`);
  q("layoutText").innerText = out;

  let extraAtk=0,extraCrit=0,extraEva=0;
  for(const slot of rules.slots){
    layout[slot].forEach(s=>{
      if(s==="ATK SPD") extraAtk+=0.10;
      if(s==="Crit Chance") extraCrit+=0.10;
      if(s==="Evasion") extraEva+=0.10;
    });
  }
  const atkTime_opt=aspdTime(baseline.atkSpd+extraAtk);
  q("optAtk").innerText=`With Optimal Gear: ${(atkTime_opt<=rules.caps.atkSpd?rules.caps.atkSpd:atkTime_opt).toFixed(3)}s`;
}

function buildLayout({cls,focus,weaponCat,weaponTier,gearTier,baseline}){
  const normalLines=tierLines[gearTier];
  const layout={};

  // allocate caps
  const capStats=["ATK SPD","Crit Chance","Evasion"];
  const placedCaps=new Set();
  for(const slot of rules.slots){
    if(slot==="Weapon"){layout[slot]=[];continue;}
    const arr=[];
    for(const stat of capStats){
      if(slotPools[slot].includes(stat) && !placedCaps.has(stat)){
        arr.push(stat);placedCaps.add(stat);break;
      }
    }
    layout[slot]=arr;
  }

  // fill rest
  const prio=prioByFocus[focus];
  for(const slot of rules.slots){
    if(slot==="Weapon") continue;
    const arr=layout[slot];
    const chosen=new Set(arr);
    for(const stat of prio){
      if(arr.length>=normalLines) break;
      if(!slotPools[slot].includes(stat)) continue;
      if(chosen.has(stat)) continue;
      arr.push(stat);chosen.add(stat);
    }
    if((gearTier==="Chaos"||gearTier==="Abyss") && rules.purpleBySlot[slot]){
      arr.push(`(5th: ${rules.purpleBySlot[slot]})`);
    }
    layout[slot]=arr;
  }

  // weapon
  layout.Weapon=buildWeapon({focus,weaponCat,weaponTier});
  return layout;
}

function buildWeapon({focus,weaponCat,weaponTier}){
  if(weaponCat==="World Boss / PvP") return ["ATK%","Crit DMG"];
  const lines=tierLines[weaponTier];
  const arr=[];
  arr.push(focus==="DPS"?"Cast Demon Lord":"Cast Evasion");
  const chosen=new Set(arr);
  const prio=prioByFocus[focus];
  const weaponPool=["ATK%","Crit DMG","DEF%","HP%","DR","Monster DMG"];
  for(const stat of prio){
    if(arr.length>=lines) break;
    if(!weaponPool.includes(stat)) continue;
    if(chosen.has(stat)) continue;
    arr.push(stat);chosen.add(stat);
  }
  if(weaponTier==="Chaos"||weaponTier==="Abyss"){
    arr.push(`(5th: ${focus==="DPS"?"Crit DMG +80":"HP% +52%"})`);
  }
  return arr;
}
