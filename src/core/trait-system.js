"use strict";

function traitSystemState(){
 if(!S.traitProgress||typeof S.traitProgress!=="object")S.traitProgress={};
 if(!S.traitJourneys||typeof S.traitJourneys!=="object")S.traitJourneys={};
 if(!Array.isArray(S.hiddenTraits))S.hiddenTraits=[];
 if(!S.hiddenTraitSources||typeof S.hiddenTraitSources!=="object")S.hiddenTraitSources={};
 if(!Array.isArray(S.fusionHistory))S.fusionHistory=[];
 if(!S.traitChoiceState||typeof S.traitChoiceState!=="object")S.traitChoiceState={};
 const state=S.traitChoiceState;
 if(!Number.isFinite(state.misses))state.misses=0;
 if(!Array.isArray(state.recentChoiceIds))state.recentChoiceIds=[];
 return state;
}

function traitJourney(name){
 traitSystemState();
 if(!S.traitJourneys[name]||typeof S.traitJourneys[name]!=="object"){
  S.traitJourneys[name]={xp:0,uses:0,failures:0,months:[],npcs:[],scenes:[],positiveNpcs:[],styles:{},highStressUses:0,fusedInto:null};
 }
 const journey=S.traitJourneys[name];
 for(const key of ["months","npcs","scenes","positiveNpcs"])if(!Array.isArray(journey[key]))journey[key]=[];
 if(!journey.styles||typeof journey.styles!=="object")journey.styles={};
 for(const key of ["xp","uses","failures","highStressUses"])journey[key]=Math.max(0,Number(journey[key])||0);
 const legacy=Math.max(0,Number(S.traitProgress[name])||0);
 if(legacy>journey.xp)journey.xp=legacy;
 S.traitProgress[name]=journey.xp;
 return journey;
}

function getTraitXp(name){return traitJourney(name).xp;}
function getTraitLevel(name){
 const xp=getTraitXp(name);
 if(xp>=TRAIT_LEVEL_THRESHOLDS[2])return 3;
 if(xp>=TRAIT_LEVEL_THRESHOLDS[1])return 2;
 return 1;
}
function hasHiddenTrait(name){traitSystemState();return S.hiddenTraits.includes(name);}
function progressiveTraitNames(){return TRAIT_CHOICE_SETS.filter(set=>!set.hidden).map(set=>set.trait);}

function getVisibleTraitBadges(){
 traitSystemState();
 const progressive=new Set(progressiveTraitNames());
 const selected=S.traits.map(i=>S.pool[i]&&S.pool[i][0]).filter(Boolean).map(name=>{
  if(!progressive.has(name))return {label:name,className:"",title:""};
  const journey=traitJourney(name),locked=journey.fusedInto;
  const next=getTraitLevel(name)>=3?"已到当前上限":`距下一级还差 ${TRAIT_LEVEL_THRESHOLDS[getTraitLevel(name)]-journey.xp} 次跨月使用`;
  return {label:`${name} Lv.${getTraitLevel(name)}`,className:"progress-trait",title:locked?`已参与合成【${locked}】，普通专属选项不再出现。`:`${next}；同一特质每月最多成长一次。`};
 });
 const hidden=S.hiddenTraits.map(name=>({label:`${name} · 隐藏`,className:"hidden-trait",title:HIDDEN_TRAITS[name]?.desc||"角色型隐藏特质"}));
 return [...selected,...hidden];
}

function contextHasTags(context,requiredTags){
 const tags=Array.isArray(context.tags)?context.tags:[];
 return requiredTags.every(tag=>tags.includes(tag));
}
function sourceTraitLocked(name){return Boolean(traitJourney(name).fusedInto);}
function activeTraitForSet(set){
 if(set.hidden)return hasHiddenTrait(set.trait)?set.trait:null;
 return hasTrait(set.trait)&&!sourceTraitLocked(set.trait)?set.trait:null;
}
function availableTraitTemplates(set){
 if(set.hidden)return set.choices||[];
 const level=getTraitLevel(set.trait);
 return (set.choices||[]).filter(choice=>(choice.minLevel||1)<=level);
}
function chooseFreshTraitTemplate(templates){
 const state=traitSystemState(),recent=state.recentChoiceIds.slice(-4);
 const fresh=templates.filter(template=>!recent.includes(template.id));
 return randomItem(fresh.length?fresh:templates);
}
function chooseTraitCandidate(candidates){
 const state=traitSystemState();
 const alternatives=candidates.filter(candidate=>candidate.set.id!==state.lastSetId);
 const picked=randomItem(alternatives.length?alternatives:candidates);
 state.lastSetId=picked?.set.id||null;
 return picked;
}
function shouldOfferTraitChoice(set,context){
 const state=traitSystemState(),eventId=context.eventId||`${S.term}:${S.month}:${context.npc||"event"}`;
 if(state.lastEventId===eventId)return false;
 state.lastEventId=eventId;
 if(context.forceTraitChoice){state.misses=0;return true;}
 const offered=state.misses>=1||gameRandom()<(set.offerChance??.76);
 if(offered)state.misses=0;else state.misses+=1;
 return offered;
}

function traitCheck(set,npcName,context={}){
 const affinity=["癫佬","古明地恋"].includes(set.trait)?Number(NPCS[npcName]?.chaosAffinity)||0:0;
 return resolveCheck({
  stat:set.stat||"expression",statLabel:ATTRIBUTES[set.stat||"expression"].label,difficulty:set.difficulty||7,
  modifiers:[
   {label:`${npcName}的接受度`,value:affinity},
   {label:"已经熟悉",value:getRelation(npcName)>=5?1:0},
   {label:"场合严肃",value:context.serious?-1:0},
   {label:"隐藏特质",value:set.hidden?1:0}
  ],
  dice:context.checkDice,label:`${set.trait}反应`
 });
}

function traitReactionText(name,npcName,grade){
 const failure={
  "癫佬":`${npcName}确认你不是在开玩笑以后，直接退出了这场“决斗”。虚构武器没有伤人，但你在严肃场合无视了她的感受。`,
  "电波":`${npcName}完全没能找到你省略的前提。她停止猜谜，把话题强行拉回原点。`,
  "社恐":`你没能把最重要的部分传达出去。${npcName}没有逼问，但也只能按自己听见的半句话理解。`,
  "吉他手":`节奏散掉了，${npcName}也没听懂你想借它表达什么。技巧不能自动替代沟通。`,
  "完美主义":`${npcName}听见的只剩挑错。方案更清楚了，你们之间的距离却被标准推远。`,
  "冰山":`过短的回答被当成了拒绝。等你意识到时，${npcName}已经收回了后面的话。`,
  "古明地恋":`这一次没人接住被你砍掉的前因。${npcName}退回普通对话，气氛还是停顿了一会儿。`,
  "后藤独":`旋律没有把意思完整带出去。舞台没有替你消除紧张，只把那份慌乱也放大了。`,
  "雪之下雪乃":`你的判断是对的，语气却让${npcName}觉得自己也成了待修正的问题。`
 };
 if(grade==="failure")return failure[name]||`${npcName}没有接住这次表达，关系因此受到了影响。`;
 if(grade==="setback")return `${npcName}没有完全跟上，却愿意把这段对话留到下一次。事情没有变好，也没有被一次选择彻底毁掉。`;
 if(grade==="success")return `${npcName}接住了你的表达。方式并不普通，但它确实让你们多了一段可以继续的共同经历。`;
 return `${npcName}不只听懂了，还主动把下一步接了过去。旁边的人或许莫名其妙，你们却已经形成了自己的节奏。`;
}

function recordTraitImpression(name,npcName,check,template){
 if(!S.npcImpressions||typeof S.npcImpressions!=="object")S.npcImpressions={};
 const impression=S.npcImpressions[npcName]||{traitUses:{},traitFailures:{}};
 impression.traitUses=impression.traitUses||{};impression.traitFailures=impression.traitFailures||{};
 impression.traitUses[name]=(impression.traitUses[name]||0)+1;
 if(["failure","setback"].includes(check.grade))impression.traitFailures[name]=(impression.traitFailures[name]||0)+1;
 impression.lastTrait=name;impression.lastGrade=check.grade;S.npcImpressions[npcName]=impression;
 if(check.grade==="failure")changeTrust(npcName,-1,"这次表达没有顾及对方");
 if(name==="癫佬"&&check.grade==="failure")S.flags[`chaosAftermath:${npcName}`]={choiceId:template.id,term:S.term,month:S.month,pending:true};
}

function recordTraitUse(name,context={},check={grade:"success"},template={style:"general"}){
 const journey=traitJourney(name);journey.uses+=1;
 const npc=context.npc,scene=context.sceneCategory||"campus",style=template.style||"general";
 if(NPCS[npc]&&!journey.npcs.includes(npc))journey.npcs.push(npc);
 if(scene&&!journey.scenes.includes(scene))journey.scenes.push(scene);
 if(["success","great"].includes(check.grade)&&NPCS[npc]&&!journey.positiveNpcs.includes(npc))journey.positiveNpcs.push(npc);
 if(check.grade==="failure")journey.failures+=1;
 journey.styles[style]=(journey.styles[style]||0)+1;
 if(style==="performance"&&S.resources.stress>=55)journey.highStressUses+=1;
 if(!HIDDEN_TRAITS[name]){
  const key=monthKey();
  if(!journey.months.includes(key)){
   const oldLevel=getTraitLevel(name);
   journey.months.push(key);journey.xp+=1;S.traitProgress[name]=journey.xp;
   const newLevel=getTraitLevel(name);
   log(`【${name}】留下了一次跨月成长记录（${journey.xp}）。`);
   if(newLevel>oldLevel)rememberImpact(`trait-level:${name}:${newLevel}`,`常规特质【${name}】提升到 Lv.${newLevel}`);
  }
 }
 return journey;
}

// 兼容旧调试调用；正式选项统一走 recordTraitUse。
function advanceTraitProgress(set,context={}){return recordTraitUse(set.trait,context,{grade:"success"},{style:"general"});}

function applyTraitChoiceCost(set,check){
 Object.entries(set.cost||{}).forEach(([key,value])=>changeResource(key,value,`【${set.trait}】的行动代价`));
 if(check.grade==="failure")changeResource("stress",3,"表达失败留下的压力");
 if(check.grade==="great")changeResource("stress",-2,"有人真正接住了你");
}

const TRAIT_CHOICE_RESOLVERS={
 traitNpc(set,template,context){
  const npcName=context.npc;ensureNpc(npcName,1);
  const check=traitCheck(set,npcName,context),delta=(set.relation||{})[check.grade]??0;
  if(delta)changeRelation(npcName,delta,`【${set.trait}】判定`);
  if(check.grade==="great")changeTrust(npcName,1,"接住了不寻常的表达");
  recordTraitImpression(set.trait,npcName,check,template);
  recordTraitUse(set.trait,context,check,template);
  applyTraitChoiceCost(set,check);
  const state=traitSystemState();state.recentChoiceIds.push(template.id);state.recentChoiceIds=state.recentChoiceIds.slice(-4);
  rememberChoice(context.eventId||`trait:${set.id}`,template.id,template.label,set.tags||[],`对${npcName}使用了【${set.trait}】选项（${check.gradeLabel}）`);
  return `${template.result}\n\n${traitReactionText(set.trait,npcName,check.grade)}\n\n${formatCheck(check)}`;
 }
};

function traitChoicePreview(set){
 const parts=Object.entries(set.cost||{}).filter(([,value])=>value).map(([key,value])=>`${{energy:"精力",stress:"压力",cash:"零花钱"}[key]}${formatSigned(value)}`);
 parts.push("可能改变关系");
 return parts.join(" · ");
}
function buildInjectedTraitChoice(set,template,context){
 const resolver=TRAIT_CHOICE_RESOLVERS[set.resolver],level=set.hidden?"":` Lv.${getTraitLevel(set.trait)}`;
 return [`【${set.trait}${level}】${template.label}`,template.result,()=>resolver(set,template,context),{className:"trait-choice",trait:set.trait,choiceId:template.id,preview:traitChoicePreview(set)}];
}

/** 替换一个明确允许改写的普通选项；安全回应和关键路线永不参与。 */
function injectTraitChoices(baseChoices,context={}){
 const choices=Array.isArray(baseChoices)?[...baseChoices]:[];
 if(!context.allowTraitChoices||choices.length<2)return choices;
 const candidates=TRAIT_CHOICE_SETS.map(set=>{
  if(typeof set.when==="function"&&!set.when(context))return null;
  if(!activeTraitForSet(set)||!contextHasTags(context,set.requiredTags||[]))return null;
  const templates=availableTraitTemplates(set);
  const slots=choices.map((choice,index)=>({meta:choice[3]||{},index})).filter(({meta})=>meta.replaceable===true&&!meta.protected&&(set.replaceRoles||[]).includes(meta.role));
  return templates.length&&slots.length?{set,templates,slots}:null;
 }).filter(Boolean);
 if(!candidates.length)return choices;
 const candidate=chooseTraitCandidate(candidates);
 if(!shouldOfferTraitChoice(candidate.set,context))return choices;
 const template=chooseFreshTraitTemplate(candidate.templates),slot=randomItem(candidate.slots).index,replaced=choices[slot];
 choices[slot]=buildInjectedTraitChoice(candidate.set,template,context);
 choices[slot][3].replacedId=replaced[3]?.id||String(slot);choices[slot][3].replacedLabel=replaced[0];
 return choices;
}

function unionValues(items){return [...new Set(items.flat())];}
function sharedPositiveNpcs(sources){
 const [first,...rest]=sources.map(name=>traitJourney(name).positiveNpcs);
 return (first||[]).filter(name=>rest.every(list=>list.includes(name)));
}
function fusionEligibility(id){
 const recipe=FUSION_RECIPES.find(item=>item.id===id||item.hidden===id);
 if(!recipe)return {eligible:false,missingRecipe:true};
 const journeys=recipe.sources.map(traitJourney),shared=sharedPositiveNpcs(recipe.sources);
 const people=unionValues(journeys.map(journey=>journey.npcs)),scenes=unionValues(journeys.map(journey=>journey.scenes));
 const selected=recipe.sources.every(name=>hasTrait(name)),unused=journeys.every(journey=>!journey.fusedInto);
 const checks={
  selected,unused,notOwned:!hasHiddenTrait(recipe.hidden),time:S.calendarIndex>=recipe.earliestIndex,
  each:journeys.every(journey=>journey.xp>=recipe.minEach),total:journeys.reduce((sum,journey)=>sum+journey.xp,0)>=recipe.totalXp,
  people:people.length>=recipe.minNpcs,scenes:scenes.length>=recipe.minScenes,
  shared:!recipe.sharedPositive||shared.length>0,
  performance:!recipe.needsPerformance||journeys.some(journey=>(journey.styles.performance||0)>0),
  highStress:!recipe.needsHighStress||journeys.some(journey=>journey.highStressUses>0),
  trusted:!recipe.needsTrusted||shared.some(name=>(S.npcTrust[name]||0)>=2||getRelation(name)>=4),
  academic:!recipe.needsAcademic||S.stats.academic>=recipe.needsAcademic,
  directHelp:!recipe.needsDirectHelp||journeys.some(journey=>(journey.styles["direct-help"]||0)>0),
  friction:!recipe.needsFriction||journeys.some(journey=>journey.failures>0)||people.some(name=>getRelation(name)<=0),
  waiting:S.calendarIndex<(Number(S.flags[`fusionDeferredUntil:${recipe.id}`])||0)
 };
 return {id:recipe.id,hidden:recipe.hidden,sources:recipe.sources,xp:journeys.map(journey=>journey.xp),people:people.length,scenes:scenes.length,shared,...checks,eligible:Object.entries(checks).every(([key,value])=>key==="waiting"?!value:Boolean(value))};
}
function fusionStatus(){return Object.fromEntries(FUSION_RECIPES.map(recipe=>[recipe.hidden,fusionEligibility(recipe.id)]));}

function acceptFusion(recipe){
 if(!S.hiddenTraits.includes(recipe.hidden))S.hiddenTraits.push(recipe.hidden);
 S.hiddenTraitSources[recipe.hidden]=[...recipe.sources];
 recipe.sources.forEach(name=>{traitJourney(name).fusedInto=recipe.hidden;});
 const record={trait:recipe.hidden,sources:[...recipe.sources],year:S.year,month:S.month,index:S.calendarIndex};
 S.fusionHistory.push(record);S.flags[`fusionAwakened:${recipe.id}`]=record;
 if(recipe.id==="koishi")S.flags.koishiAwakenedAt={year:S.year,month:S.month,index:S.calendarIndex};
 rememberImpact(`fusion:${recipe.id}`,`${S.term}${S.month}月，由${recipe.sources.join("＋")}合成隐藏特质【${recipe.hidden}】`);
 return recipe.acceptText;
}
function tryTraitFusion(done){
 const recipe=FUSION_RECIPES.find(item=>fusionEligibility(item.id).eligible);
 if(!recipe)return false;
 showChoices(recipe.tag,recipe.title,recipe.text,[
  [recipe.accept,recipe.acceptText,()=>acceptFusion(recipe),{id:`accept-${recipe.id}`,protected:true,preview:`合成隐藏特质【${recipe.hidden}】`}],
  ["先不让它定型",`你把这次变化留在半途。至少两个月后，它仍可能再次出现。`,()=>{S.flags[`fusionDeferredUntil:${recipe.id}`]=S.calendarIndex+2;changeResource("stress",-3,"暂缓定型");return `你暂时没有接受【${recipe.hidden}】。已有成长不会消失，至少两个月后可以再次触发。`;},{id:`defer-${recipe.id}`,protected:true,preview:"压力-3 · 延后至少2个月"}]
 ],done,{eventId:`fusion:${recipe.id}`,allowTraitChoices:false});
 return true;
}

// 为旧调试入口保留别名；正式流程使用通用合成系统。
function chaosEvolutionEligibility(){return fusionEligibility("koishi");}
function tryChaosEvolution(done){return tryTraitFusion(done);}
