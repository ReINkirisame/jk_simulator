"use strict";

// 普通特质有自己的生效领域。成长/合成不改变这里的稳定基础规则。
// 所有预测仅调用 traitActivityModifiers；资源和失败复盘只在真实判定后结算。
const TRAIT_ACTIVITY_BONUS_CAP=2;
const TRAIT_MONTHLY_RECOVERY_CAP={energy:6,stress:6};

function traitCategoryLabel(name){return TRAIT_PROFILES[name]?.category||"特殊";}
function traitDomainsText(name){
 const profile=TRAIT_PROFILES[name];
 if(!profile)return "";
 return (profile.domains||[]).map(domain=>TRAIT_DOMAIN_LABELS[domain]||domain).join("、")||"月间恢复";
}
function traitEffectDescription(name){
 const p=TRAIT_PROFILES[name];if(!p)return "";
 if(p.effectHelp)return p.effectHelp;
 const effects=[];
 if(p.modifier){
  const limit=p.condition==="familiar"?"（对象关系≥3或熟悉度≥3）":p.condition==="calm"?"（当前压力<70）":"";
  effects.push(`${traitDomainsText(name)}判定${formatSigned(p.modifier)}${limit}；正向特质合计最多+2`);
 }
 if(p.monthly)effects.push("每月"+Object.entries(p.monthly).map(([key,value])=>({energy:"精力",stress:"压力"}[key])+formatSigned(value)).join("、")+"（多项恢复各最多6）");
 if(p.cost)effects.push("每月首次在上述判定发挥时额外"+Object.entries(p.cost).map(([key,value])=>({energy:"精力",stress:"压力"}[key])+formatSigned(value)).join("、"));
 return effects.join("；")+"。";
}
function normalTraitBenefitNames(){
 const names=typeof ownedTraitNames==="function"?ownedTraitNames():S.traits.map(i=>S.pool[i]?.[0]).filter(Boolean);
 return [...new Set(names)].filter(name=>TRAIT_PROFILES[name]);
}
function traitActivityDomains(stat,domain,context={}){
 const aliases={creation:"creative",music:"performance",fitness:"sport"};
 const requested=Array.isArray(domain)?domain:domain?[domain]:[];
 const domains=new Set(requested.map(value=>aliases[value]||value));
 for(const extra of context.domains||[])domains.add(aliases[extra]||extra);
 // 明确领域优先；旧接口未指定领域时，按正在检定的能力作保守归类。
 if(!domains.size){
  const fallback={academic:"study",expression:"social",fitness:"sport",creativity:"creative",appearance:"presentation"};
  if(fallback[stat])domains.add(fallback[stat]);
 }
 if(domains.has("exam"))domains.add("study");
 if(domains.has("performance"))domains.add("presentation");
 if(domains.has("competition")&&stat==="fitness")domains.add("sport");
 if(domains.has("project")){
  if(stat==="creativity")domains.add("creative");
  if(stat==="fitness")domains.add("sport");
 }
 if(context.sceneCategory==="club")domains.add("club");
 return domains;
}
function applicableTraitProfiles(stat,domain,context={}){
 const domains=traitActivityDomains(stat,domain,context);
 return normalTraitBenefitNames().map(name=>({name,...TRAIT_PROFILES[name]})).filter(profile=>{
  if(!profile.modifier||!profile.domains.some(value=>value==="all"||domains.has(value)))return false;
  if(profile.condition==="familiar"){
   const npc=context.npc;
   if(!npc||!S.npcs.includes(npc)||(getRelation(npc)<3&&(S.npcFamiliarity[npc]||0)<3))return false;
  }
  if(profile.condition==="calm"&&S.resources.stress>=70)return false;
  return true;
 });
}
function traitActivityModifiers(stat,domain,context={}){
 const matching=applicableTraitProfiles(stat,domain,context),positive=matching.filter(p=>p.modifier>0),negative=matching.filter(p=>p.modifier<0);
 const result=[];
 if(positive.length){
  const total=positive.reduce((sum,p)=>sum+p.modifier,0);
  result.push({label:"特质·"+positive.map(p=>p.name).join("、")+(total>TRAIT_ACTIVITY_BONUS_CAP?"（合计封顶）":""),value:Math.min(TRAIT_ACTIVITY_BONUS_CAP,total),traitNames:positive.map(p=>p.name)});
 }
 if(negative.length)result.push({label:"逆风·"+negative.map(p=>p.name).join("、"),value:negative.reduce((sum,p)=>sum+p.modifier,0),traitNames:negative.map(p=>p.name)});
 return result;
}
function traitBenefitState(){
 if(!S.traitBenefits||typeof S.traitBenefits!=="object")S.traitBenefits={months:{},records:[]};
 if(!S.traitBenefits.months||typeof S.traitBenefits.months!=="object")S.traitBenefits.months={};
 if(!Array.isArray(S.traitBenefits.records))S.traitBenefits.records=[];
 const key=monthKey();
 if(!S.traitBenefits.months[key])S.traitBenefits.months[key]={monthly:false,costs:[],failureRewards:0};
 return S.traitBenefits.months[key];
}
function recordTraitBenefit(record){
 traitBenefitState();
 S.traitBenefits.records.push({month:monthKey(),...record});
 // 日志已保留全记录；面板只需最近的可解释来源。
 S.traitBenefits.records=S.traitBenefits.records.slice(-90);
}
function applyMonthlyTraitBenefits(){
 const month=traitBenefitState();if(month.monthly)return [];
 month.monthly=true;
 const profiles=normalTraitBenefitNames().map(name=>({name,...TRAIT_PROFILES[name]})).filter(p=>p.monthly);
 const applied=[];
 for(const key of ["energy","stress"]){
  const relevant=profiles.filter(p=>p.monthly[key]);if(!relevant.length)continue;
  const total=relevant.reduce((sum,p)=>sum+p.monthly[key],0),cap=TRAIT_MONTHLY_RECOVERY_CAP[key];
  const intended=Math.max(-cap,Math.min(cap,total));
  const actual=changeResource(key,intended,"月间特质·"+relevant.map(p=>p.name).join("、"));
  const record={kind:"monthly",traits:relevant.map(p=>p.name),resource:key,intended,actual};
  recordTraitBenefit(record);applied.push(record);
 }
 return applied;
}
function applyTraitActivityOutcome(result,stat,domain,context={}){
 if(!result||context.preview||result.traitBenefitsApplied)return [];
 // 给结果对象标记，防同一个真实结果被两个调用层重复支付或重复领奖。
 result.traitBenefitsApplied=true;
 const month=traitBenefitState(),applied=[];
 // 以实际进入骰点明细的特质为准，不能重新按已经变化的压力猜测是否生效。
 const usedNames=new Set((result.modifiers||[]).flatMap(item=>item.traitNames||[]));
 // resolveCheck 的标准化目前只保留 label/value，因此也识别明确的统一标签。
 for(const item of result.modifiers||[]){
  if(!item.label?.startsWith("特质·")&&!item.label?.startsWith("逆风·"))continue;
  for(const name of normalTraitBenefitNames())if(item.label.replace("（合计封顶）","").split("·")[1]?.split("、").includes(name))usedNames.add(name);
 }
 for(const name of usedNames){
  const profile=TRAIT_PROFILES[name];
  if(!profile?.cost||month.costs.includes(name))continue;
  month.costs.push(name);
  for(const [key,value] of Object.entries(profile.cost)){
   const actual=changeResource(key,value,`【${name}】本月首次发挥的额外消耗`);
   const record={kind:"activity-cost",trait:name,resource:key,intended:value,actual,label:result.label};recordTraitBenefit(record);applied.push(record);
  }
 }
 if(usedNames.has("非酋")&&result.margin<0&&month.failureRewards<2&&ATTRIBUTES[stat]){
  month.failureRewards+=1;
  if(stat==="appearance"){
   const actual=changeResource("stress",-2,"【非酋】接纳出镜失误");
   const record={kind:"failure-recovery",trait:"非酋",resource:"stress",actual,label:result.label};recordTraitBenefit(record);applied.push(record);
  }else if(ATTRIBUTES[stat]&&stat!=="appearance"){
   const before=Number(S.growth.xp[stat])||0,beforeStat=S.stats[stat];
   gainExperience(stat,1,"【非酋】失败复盘（每月最多2次）");
   const record={kind:"failure-xp",trait:"非酋",stat,intendedXp:1,actualXpDelta:(S.growth.xp[stat]||0)-before,actualStatDelta:S.stats[stat]-beforeStat,label:result.label};recordTraitBenefit(record);applied.push(record);
  }
 }
 return applied;
}
