"use strict";

function traitSystemState(){
 if(!S.traitProgress||typeof S.traitProgress!=="object")S.traitProgress={};
 if(!Array.isArray(S.hiddenTraits))S.hiddenTraits=[];
 if(!S.traitChoiceState||typeof S.traitChoiceState!=="object"){
   S.traitChoiceState={misses:0,lastEventId:null,recentChoiceIds:[]};
 }
 if(!Array.isArray(S.traitChoiceState.recentChoiceIds))S.traitChoiceState.recentChoiceIds=[];
 return S.traitChoiceState;
}

function getTraitXp(name){
 traitSystemState();
 return Math.max(0,Number(S.traitProgress[name])||0);
}

function getTraitLevel(name){
 const xp=getTraitXp(name);
 if(name==="癫佬")return xp>=8?3:xp>=4?2:1;
 return 1;
}

function hasHiddenTrait(name){
 traitSystemState();
 return S.hiddenTraits.includes(name);
}

function getVisibleTraitBadges(){
 traitSystemState();
 return S.traits.map(i=>S.pool[i]&&S.pool[i][0]).filter(Boolean).map(name=>{
   if(name==="癫佬"&&hasHiddenTrait("古明地恋")){
     return {label:"古明地恋 · 隐藏",className:"hidden-trait",title:HIDDEN_TRAITS["古明地恋"].desc};
   }
   if(name==="癫佬"){
     const desc=["","偶尔做出让人摸不着头脑的举动。","身边的人似乎开始习惯了。","大家已经懒得追究你的行为逻辑了。"];
     return {label:`癫佬 Lv.${getTraitLevel(name)}`,className:"progress-trait",title:desc[getTraitLevel(name)]+"出现时替换一个正常选项；有效成长每月最多一次。"};
   }
   return {label:name,className:"",title:""};
 });
}

function contextHasTags(context,requiredTags){
 const tags=Array.isArray(context.tags)?context.tags:[];
 return requiredTags.every(tag=>tags.includes(tag));
}

function activeTraitForSet(set){
 if(set.evolution&&hasHiddenTrait(set.evolution.trait))return set.evolution.trait;
 return hasTrait(set.trait)?set.trait:null;
}

function availableTraitTemplates(set,activeTrait){
 if(set.evolution&&activeTrait===set.evolution.trait)return set.evolvedChoices||[];
 const level=getTraitLevel(set.trait);
 return (set.choices||[]).filter(choice=>(choice.minLevel||1)<=level);
}

function chooseFreshTraitTemplate(templates){
 const state=traitSystemState();
 const recent=state.recentChoiceIds.slice(-3);
 const fresh=templates.filter(template=>!recent.includes(template.id));
 const pool=fresh.length?fresh:templates;
 return randomItem(pool);
}

function shouldOfferTraitChoice(set,context){
 const state=traitSystemState();
 const eventId=context.eventId||`${S.term}:${S.month}:${context.npc||"event"}`;
 if(state.lastEventId===eventId)return false;
 state.lastEventId=eventId;
 if(context.forceTraitChoice){state.misses=0;return true;}
 const offered=state.misses>=1||gameRandom()<(set.offerChance??0.5);
 if(offered)state.misses=0;
 else state.misses+=1;
 return offered;
}

function chaosCheck(activeTrait,npcName,context={}){
 const evolved=activeTrait==="古明地恋";
 const affinity=NPCS[npcName]&&Number(NPCS[npcName].chaosAffinity)||0;
 const familiarity=getRelation(npcName)>=5?1:0;
 return resolveCheck({
   difficulty:8,
   modifiers:[
     {label:`${npcName}适应度`,value:affinity},
     {label:"已经熟悉",value:familiarity},
     {label:"场合不合适",value:context.serious?-1:0},
     {label:"古明地恋",value:evolved?3:0}
   ],
   dice:context.checkDice,
   label:`${activeTrait}反应`
 });
}

function chaosRelationDelta(check,evolved){
 if(evolved)return {failure:-1,setback:0,success:1,great:2}[check.grade];
 return {failure:-3,setback:-1,success:1,great:2}[check.grade];
}

function chaosReactionText(npcName,check,evolved){
 if(evolved){
   if(check.grade==="failure")return `这次节奏确实没有对上。${npcName}把话题带回原处，气氛稍稍停顿，却没有人觉得刚才的事情值得追问。`;
   if(check.grade==="setback")return `事情就这样自然地发生了。${npcName}继续和你聊天，仿佛这本来就是正常流程。`;
   if(check.grade==="success")return `${npcName}理所当然地跟上了你的思路。等话题结束，你们之间多了一段只有彼此明白的经历。`;
   return `${npcName}不仅接住了你的世界线，还擅自往里面添了一段。旁边的人听完全程，也只觉得你们本来就一直这样说话。`;
 }
 if(check.grade==="failure")return `${npcName}没有笑。她确认你是认真的以后，干脆结束了这段对话；接下来几次在走廊碰见，她也明显没有主动靠近。`;
 if(check.grade==="setback")return `${npcName}沉默了好一会儿，最后只回了一句“……所以呢？”这件事没有当场爆炸，但尴尬确实留了下来。`;
 if(check.grade==="success")return `${npcName}先是愣住，随后真的笑了出来。这个突如其来的怪话成了你们之间的新话题。`;
 return `${npcName}不仅接住了，还立刻把事情推向了更离谱的方向。附近的人开始围观，而你们已经拥有了第一个共同犯案现场。`;
}

function recordChaosImpression(npcName,check,evolved,template){
 if(!S.npcImpressions||typeof S.npcImpressions!=="object")S.npcImpressions={};
 const impression=S.npcImpressions[npcName]||{chaosUses:0,awkward:0,sharedJokes:0};
 impression.chaosUses+=1;
 if(check.grade==="failure"||check.grade==="setback")impression.awkward+=1;
 if(check.grade==="success"||check.grade==="great")impression.sharedJokes+=1;
 impression.lastGrade=check.grade;
 S.npcImpressions[npcName]=impression;
 if(check.grade==="failure")changeTrust(npcName,-1,"没有顾及对方的感受");
 if(!evolved&&check.grade==="failure"){
   S.flags[`chaosAftermath:${npcName}`]={
     choiceId:template.id,
     term:S.term,
     month:S.month,
     pending:true
   };
 }
}

function advanceTraitProgress(set,context={}){
 if(set.evolution&&hasHiddenTrait(set.evolution.trait))return null;
 const record=S.traitMilestones;
 const npc=context.npc,scene=context.sceneCategory;
 if(NPCS[npc]&&!record.npcs.includes(npc))record.npcs.push(npc);
 if(["classroom","campus","club","holiday"].includes(scene)&&!record.scenes.includes(scene))record.scenes.push(scene);
 const key=monthKey();
 if(!record.months.includes(key)){
  record.months.push(key);S.traitProgress[set.trait]=getTraitXp(set.trait)+1;
  log("【癫佬】留下了一次跨月习惯记录。本月再使用仍有后果，但不重复成长。");
 }
 return null;
}

function chaosEvolutionEligibility(){
 const rule=TRAIT_CHOICE_SETS[0].evolution,record=S.traitMilestones;
 return {time:S.calendarIndex>=rule.earliestIndex,xp:getTraitXp("癫佬")>=rule.xp,
  people:record.npcs.length>=rule.minNpcs,scenes:record.scenes.length>=rule.minScenes,
  waiting:S.calendarIndex<(S.flags.koishiDeferredUntil||0)};
}
function tryChaosEvolution(done){
 if(!hasTrait("癫佬")||hasHiddenTrait("古明地恋"))return false;
 const e=chaosEvolutionEligibility();
 if(!e.time||!e.xp||!e.people||!e.scenes||e.waiting)return false;
 const people=S.traitMilestones.npcs.slice(0,4).join("、");
 showChoices("长期特质 · 专属事件","大家已经习惯了",`${S.term.includes("寒假")?"寒假聚会时":"放学后的聚会里"}，你突然宣称，这张桌子其实是一个尚未启航的太空站。\n\n没有人追问原因。有人递来一张纸让你画航线，有人把饮料往桌边挪，给不存在的操作台腾出位置。${people}都在场。\n\n你想起那些分散在课堂、社团和假期里的荒唐时刻。那时候总有人愣住，等你解释；现在，航线图已经传到了桌子另一头。`,[
  ["就照平常的样子继续","你开始分配舰桥值日。",()=>{
   S.hiddenTraits.push("古明地恋");S.flags.koishiAwakenedAt={year:S.year,month:S.month,index:S.calendarIndex};
   rememberImpact("koishi-awakening",`${S.term}${S.month}月，获得隐藏特质【古明地恋】`);
   return "她们很自然地接了下去。你甚至没找到一个值得郑重宣布变化的瞬间。\n\n获得隐藏特质【古明地恋】：怪举动更容易被接住，但仍会替换正常选项，也仍然可能让人不舒服。";
  },{id:"accept",protected:true}],
  ["今天先收一收，好好听她们说","你把航线图翻过来，问起大家真正想聊的事。",()=>{
   S.flags.koishiDeferredUntil=S.calendarIndex+2;changeResource("stress",-4,"暂时放下表演");
   return "你决定先停在这里。已经形成的习惯不会消失，至少两个月后仍有机会发生变化。";
  },{id:"defer",protected:true}]
 ],done,{eventId:"koishi-awakening",allowTraitChoices:false});
 return true;
}

const TRAIT_CHOICE_RESOLVERS={
 chaosNpc(set,template,context,activeTrait){
   const npcName=context.npc;
   const evolved=activeTrait==="古明地恋";
   const check=chaosCheck(activeTrait,npcName,context);
   const delta=chaosRelationDelta(check,evolved);
   changeRelation(npcName,delta,`【${activeTrait}】判定`);
   recordChaosImpression(npcName,check,evolved,template);

   const state=traitSystemState();
   state.recentChoiceIds.push(template.id);
   state.recentChoiceIds=state.recentChoiceIds.slice(-3);

   advanceTraitProgress(set,context);
   rememberChoice(context.eventId||"chaos",template.id,template.label,["跳脱"],`对${npcName}做出了跳脱举动（${check.gradeLabel}）`);
   changeResource("stress",check.grade==="failure"?5:-2,"突如其来的举动");
   const mood=delta>0?"关系更近了":delta<0?"关系受到了影响":"关系没有变化";
   log(`【${activeTrait}】${template.label}；和【${npcName}】${mood}。`);

   let result=`${template.result}\n\n${chaosReactionText(npcName,check,evolved)}\n\n${formatCheck(check)}`;
   return result;
 }
};

function buildInjectedTraitChoice(set,template,context,activeTrait){
 const resolver=TRAIT_CHOICE_RESOLVERS[set.resolver];
 const level=activeTrait===set.trait?` Lv.${getTraitLevel(set.trait)}`:"";
 return [
   `【${activeTrait}${level}】${template.label}`,
   template.result,
   ()=>resolver(set,template,context,activeTrait),
   {className:"trait-choice",trait:activeTrait,choiceId:template.id}
 ];
}

/**
 * 替换最多一个显式允许替换的普通选项。关键决定与单选继续页不参与。
 * context 示例：
 * {allowTraitChoices:true,tags:["npc","social"],npc:"中二病",eventId:"npc-talk-1"}
 */
function injectTraitChoices(baseChoices,context={}){
 const choices=Array.isArray(baseChoices)?[...baseChoices]:[];
 if(!context.allowTraitChoices||choices.length<2)return choices;

 const candidates=TRAIT_CHOICE_SETS.map(set=>{
   const activeTrait=activeTraitForSet(set);
   if(!activeTrait||!contextHasTags(context,set.requiredTags||[]))return null;
   const templates=availableTraitTemplates(set,activeTrait);
   const slots=choices.map((choice,index)=>({meta:choice[3]||{},index})).filter(({meta})=>meta.replaceable===true&&!meta.protected&&(set.replaceRoles||[]).includes(meta.role));
   return templates.length&&slots.length?{set,activeTrait,templates,slots}:null;
 }).filter(Boolean);

 if(!candidates.length)return choices;
 const candidate=randomItem(candidates);
 if(!shouldOfferTraitChoice(candidate.set,context))return choices;
 const template=chooseFreshTraitTemplate(candidate.templates);
 const slot=randomItem(candidate.slots).index;
 const replaced=choices[slot];
 choices[slot]=buildInjectedTraitChoice(candidate.set,template,context,candidate.activeTrait);
 choices[slot][3].replacedId=replaced[3].id||String(slot);
 choices[slot][3].replacedLabel=replaced[0];
 return choices;
}
