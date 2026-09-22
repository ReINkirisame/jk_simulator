"use strict";

const CHECK_LABELS={
 failure:"大失败",
 setback:"小失败",
 success:"普通成功",
 great:"特别成功"
};

function statCheckModifier(value){
 const n=Math.max(0,Number(value)||0);
 return n>=25?4:n>=20?3:Math.floor(n/4)-2;
}

function checkGrade(margin){
 if(margin>=3)return "great";
 if(margin>=0)return "success";
 if(margin>=-2)return "setback";
 return "failure";
}

/**
 * 半透明的统一判定：2d6 + 属性 + 情境修正，对比难度。
 * dice 只用于自动测试或调试；正常游戏会从统一随机源取得骰点。
 */
function resolveCheck({
 stat=null,
 statValue=null,
 statLabel=null,
 difficulty=7,
 modifiers=[],
 dice=null,
 label="判定"
}={}){
 const rolled=Array.isArray(dice)&&dice.length===2
   ?dice.map(value=>Math.max(1,Math.min(6,Number(value)||1)))
   :[randomInt(1,6),randomInt(1,6)];
 const normalized=[];
 if(stat||statValue!==null){
   const value=statValue!==null?statValue:S.stats[stat];
   normalized.push({label:statLabel||(ATTRIBUTES[stat]?.label??"综合能力"),value:statCheckModifier(value)});
 }
 (Array.isArray(modifiers)?modifiers:[]).forEach(item=>{
   if(!item)return;
   const value=Number(item.value)||0;
   if(value)normalized.push({label:item.label||"修正",value,...(item.traitNames?{traitNames:[...item.traitNames]}:{})});
 });
 const roll=rolled[0]+rolled[1];
 const modifierTotal=normalized.reduce((sum,item)=>sum+item.value,0);
 const total=roll+modifierTotal;
 const margin=total-difficulty;
 const grade=checkGrade(margin);
 const result={label,dice:rolled,roll,modifiers:normalized,modifierTotal,total,difficulty,margin,grade,gradeLabel:CHECK_LABELS[grade]};
 if(!Array.isArray(S.checks))S.checks=[];
 S.checks.push({...result,term:S.term,month:S.month});
 S.checks=S.checks.slice(-30);
 return result;
}

function formatSigned(value){return value>0?`+${value}`:`${value}`}
function formatCheck(result,{showDice=true}={}){
 const modifierText=result.modifiers.length
   ?"，"+result.modifiers.map(item=>`${item.label}${formatSigned(item.value)}`).join("，")
   :"";
 const diceText=showDice?`2d6=${result.dice[0]}+${result.dice[1]}，`:"";
 return `【${result.gradeLabel}】${diceText}${modifierText.replace(/^，/,"")} → 合计${result.total}；难度${result.difficulty}`;
}
