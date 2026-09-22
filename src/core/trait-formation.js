"use strict";

function normalizeTraitFormationState(){
 if(!Array.isArray(S.acquiredTraits))S.acquiredTraits=[];
 S.acquiredTraits=[...new Set(S.acquiredTraits.filter(name=>Object.hasOwn(TRAIT_FORMATION_DEFS,name)))];
 if(!S.traitFormation||typeof S.traitFormation!=="object"||Array.isArray(S.traitFormation))S.traitFormation={};
 if(!Array.isArray(S.traitFormationHistory))S.traitFormationHistory=[];
 if(!S.traitFormation._meta||typeof S.traitFormation._meta!=="object")S.traitFormation._meta={lastOfferIndex:null};
 return S.traitFormation;
}

function traitFormationJourney(name){
 const state=normalizeTraitFormationState();
 if(!Object.hasOwn(TRAIT_FORMATION_DEFS,name))return null;
 if(!state[name]||typeof state[name]!=="object")state[name]={months:[],evidence:[],deferredUntil:0,acquiredAt:null};
 const journey=state[name];
 if(!Array.isArray(journey.months))journey.months=[];
 journey.months=[...new Set(journey.months.filter(index=>Number.isInteger(index)&&index>=0))].sort((a,b)=>a-b);
 if(!Array.isArray(journey.evidence))journey.evidence=[];
 if(!Number.isFinite(journey.deferredUntil))journey.deferredUntil=0;
 return journey;
}

function formationEvidenceForChoice(eventId,choiceId,tags=[]){
 // tags 参数保留给通用适配器，但绝不从「独处」「休息」等标签推断性格。
 const explicit=TRAIT_FORMATION_CHOICE_MAP[`${eventId}/${choiceId}`]||[];
 const practice=String(eventId).startsWith("trait-practice:")?TRAIT_PRACTICE_ACTIONS.find(action=>action.id===choiceId):null;
 return [...new Set([...explicit,...(practice?[practice.trait]:[])])];
}

function recordTraitFormationEvidence(record){
 if(!record||!Number.isInteger(record.calendarIndex)||record.calendarIndex<0)return [];
 const declared=Array.isArray(record.formationEvidence)?record.formationEvidence:[];
 const names=[...new Set([...declared,...formationEvidenceForChoice(record.eventId,record.choiceId)])];
 const counted=[];
 for(const name of names){
  if(typeof name!=="string"||!Object.hasOwn(TRAIT_FORMATION_DEFS,name)||hasTrait(name))continue;
  const journey=traitFormationJourney(name);
  if(journey.months.includes(record.calendarIndex))continue;
  journey.months.push(record.calendarIndex);journey.months.sort((a,b)=>a-b);
  journey.evidence.push({eventId:String(record.eventId||""),choiceId:String(record.choiceId||""),label:String(record.label||""),index:record.calendarIndex,term:record.term||S.term,month:record.month||S.month});
  counted.push(name);
 }
 return counted;
}

function traitFormationEligibility(name){
 const journey=traitFormationJourney(name);
 if(!journey)return {name,eligible:false,unknown:true};
 const checks={
  notOwned:!hasTrait(name),
  months:journey.months.length>=TRAIT_FORMATION_RULES.requiredMonths,
  time:S.calendarIndex>=TRAIT_FORMATION_RULES.earliestIndex,
  capacity:S.acquiredTraits.length<TRAIT_FORMATION_RULES.maxAcquired,
  cooldown:S.calendarIndex>=journey.deferredUntil
 };
 return {name,...checks,eligible:Object.values(checks).every(Boolean),count:journey.months.length,deferredUntil:journey.deferredUntil};
}

function traitFormationSummary(){
 normalizeTraitFormationState();
 return Object.entries(TRAIT_FORMATION_DEFS).map(([name,definition])=>{
  const journey=traitFormationJourney(name),eligibility=traitFormationEligibility(name);
  const acquired=S.acquiredTraits.includes(name),owned=hasTrait(name);
  const status=owned?(acquired?"后天获得":"开局拥有")
   :!eligibility.capacity?"本局后天名额已满"
   :!eligibility.cooldown?`暂缓至第${journey.deferredUntil+1}个月`
   :eligibility.eligible?"月末可选择形成"
   :eligibility.months&&!eligibility.time?"等待高一下学期"
   :`${journey.months.length}/${TRAIT_FORMATION_RULES.requiredMonths}个月`;
  return {name,months:journey.months.length,requiredMonths:TRAIT_FORMATION_RULES.requiredMonths,earliestIndex:TRAIT_FORMATION_RULES.earliestIndex,eligible:eligibility.eligible,owned,acquired,status,hint:definition.hint,cost:definition.cost};
 });
}

function acceptTraitFormation(name){
 const eligibility=traitFormationEligibility(name);
 if(!eligibility.eligible)return "当前还不能形成这项特质；已有记录保留，不会扣除开局特质。";
 const journey=traitFormationJourney(name);
 S.acquiredTraits.push(name);journey.acquiredAt=S.calendarIndex;
 // 形成证据不是熟练度：包括因调试或状态查询遗留的空旅程，也从零开始。
 traitSystemState();S.traitProgress[name]=0;
 S.traitJourneys[name]={xp:0,uses:0,failures:0,months:[],npcs:[],scenes:[],positiveNpcs:[],styles:{},highStressUses:0,fusedInto:null};
 const record={type:"acquired",trait:name,year:S.year,month:S.month,index:S.calendarIndex,evidenceMonths:[...journey.months]};
 S.traitFormationHistory.push(record);
 rememberChoice(`trait-formation:${name}`,"accept",`接受后天特质【${name}】`,["后天形成"]);
 rememberImpact(`trait-formation:${name}`,`经过${journey.months.length}个不同月份的尝试，自主接受后天特质【${name}】`);
 return `你决定保留这种做法。获得后天常规特质【${name}】Lv.1。\n\n形成之前的记录不折算为成长经验；之后真正使用专属行动才会成长。原来的三项开局特质不受影响，本局还可后天形成${TRAIT_FORMATION_RULES.maxAcquired-S.acquiredTraits.length}项。`;
}

function deferTraitFormation(name){
 const journey=traitFormationJourney(name);if(!journey)return "这次先不定型。";
 journey.deferredUntil=S.calendarIndex+TRAIT_FORMATION_RULES.cooldownMonths;
 S.traitFormationHistory.push({type:"deferred",trait:name,year:S.year,month:S.month,index:S.calendarIndex,until:journey.deferredUntil});
 rememberChoice(`trait-formation:${name}`,"defer",`暂不接受【${name}】`,["自主决定"]);
 return `这些行为不必替你下定义。你暂时不接受【${name}】，没有任何惩罚，也不消耗后天名额。已有记录仍在，至少${TRAIT_FORMATION_RULES.cooldownMonths}个月后才会再次询问。`;
}

function tryTraitFormation(done){
 const state=normalizeTraitFormationState();
 if(state._meta.lastOfferIndex===S.calendarIndex||S.acquiredTraits.length>=TRAIT_FORMATION_RULES.maxAcquired)return false;
 const candidates=Object.keys(TRAIT_FORMATION_DEFS).filter(name=>traitFormationEligibility(name).eligible)
  .sort((a,b)=>traitFormationJourney(b).months.length-traitFormationJourney(a).months.length);
 const name=candidates[0];if(!name)return false;
 state._meta.lastOfferIndex=S.calendarIndex;
 const definition=TRAIT_FORMATION_DEFS[name],journey=traitFormationJourney(name);
 const evidence=journey.evidence.slice(-3).map(item=>`· ${item.term} ${item.month}月：${item.label}`).join("\n");
 showChoices("后天特质 · 自己决定","要不要保留这种做法？",`${definition.text}\n\n${evidence}\n\n你已经在${journey.months.length}个不同月份选择过相关做法。这是可拒绝的游戏倾向，不是对你的性格诊断。\n\n${definition.cost}`,[
  [`把它保留下来：${name}`,"",()=>acceptTraitFormation(name),{id:"accept",protected:true,preview:`获得【${name}】Lv.1 · 使用1个后天名额`}],
  ["这次不定型，先按原来的方式生活","",()=>deferTraitFormation(name),{id:"defer",protected:true,preview:`无惩罚 · 至少${TRAIT_FORMATION_RULES.cooldownMonths}个月后再问`}]
 ],typeof done==="function"?done:()=>{},{eventId:`trait-formation:${name}`,allowTraitChoices:false});
 return true;
}

function buildTraitPracticeChoice(name){
 const action=TRAIT_PRACTICE_ACTIONS.find(item=>item.trait===name||item.id===name);if(!action)return null;
 const owned=hasTrait(action.trait);
 return {id:action.id,label:action.label,text:action.text,protected:true,
  formationEvidence:owned?[]:[action.trait],
  preview:`精力${action.energy} · 压力${action.stress>0?"+":""}${action.stress} · ${owned?"普通练习，不获得特质成长经验":`【${action.trait}】形成记录+1个月（同月不重复）`}`,
  effects:[{type:"xp",key:action.stat,value:1},{type:"resource",key:"energy",value:action.energy},{type:"resource",key:"stress",value:action.stress}]
 };
}

function buildTraitPracticeEvent(){
 normalizeTraitFormationState();
 const choices=S.acquiredTraits.length>=TRAIT_FORMATION_RULES.maxAcquired?[]:TRAIT_PRACTICE_ACTIONS.filter(action=>!hasTrait(action.trait)).map(action=>buildTraitPracticeChoice(action.trait));
 choices.push({id:"keep-rhythm",label:"这段时间先不尝试新做法",protected:true,text:"你沿用原来的节奏。尝试新做法不是每个月都必须完成的任务。",effects:[]});
 return {id:`trait-practice:${S.calendarIndex}`,tag:"日常尝试 · 普通行动",title:"腾出来的一点时间",text:`你可以用这段时间试一种处理事情的方式。相关做法至少积累${TRAIT_FORMATION_RULES.requiredMonths}个不同月份后，才可能在月末由你决定是否形成特质；本局最多后天获得${TRAIT_FORMATION_RULES.maxAcquired}项。\n\n只休息、独处或上网，不会被自动判定为某种性格。`,choices,context:{allowTraitChoices:false,sceneCategory:"practice"}};
}
