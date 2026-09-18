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
 if(name==="癫佬")return xp>=4?3:xp>=2?2:1;
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
     return {label:`癫佬 Lv.${getTraitLevel(name)}`,className:"progress-trait",title:"在人物互动中偶尔出现专属选项。"};
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
 if(!evolved&&check.grade==="failure"){
   S.flags[`chaosAftermath:${npcName}`]={
     choiceId:template.id,
     term:S.term,
     month:S.month,
     pending:true
   };
 }
}

function advanceTraitProgress(set){
 if(set.evolution&&hasHiddenTrait(set.evolution.trait))return null;
 const next=getTraitXp(set.trait)+1;
 S.traitProgress[set.trait]=next;
 if(set.evolution&&next>=set.evolution.xp){
   S.hiddenTraits.push(set.evolution.trait);
   log(`隐藏特质解锁：【${set.evolution.trait}】。`);
   return set.evolution.trait;
 }
 return null;
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

   const unlocked=advanceTraitProgress(set);
   const mood=delta>0?"关系更近了":delta<0?"关系受到了影响":"关系没有变化";
   log(`【${activeTrait}】${template.label}；和【${npcName}】${mood}。`);

   let result=`${template.result}\n\n${chaosReactionText(npcName,check,evolved)}\n\n${formatCheck(check)}`;
   if(unlocked){
     result+=`\n\n某种东西越过了临界点。隐藏特质【${unlocked}】已解锁：以后类似的举动会被周围人自然接受，人际结果也更偏向积极。`;
   }
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
 * 为现有事件追加最多一个特质专属选项。
 * context 示例：
 * {allowTraitChoices:true,tags:["npc","social"],npc:"中二病",eventId:"npc-talk-1"}
 */
function injectTraitChoices(baseChoices,context={}){
 const choices=Array.isArray(baseChoices)?[...baseChoices]:[];
 if(!context.allowTraitChoices)return choices;

 const candidates=TRAIT_CHOICE_SETS.map(set=>{
   const activeTrait=activeTraitForSet(set);
   if(!activeTrait||!contextHasTags(context,set.requiredTags||[]))return null;
   const templates=availableTraitTemplates(set,activeTrait);
   return templates.length?{set,activeTrait,templates}:null;
 }).filter(Boolean);

 if(!candidates.length)return choices;
 const candidate=randomItem(candidates);
 if(!shouldOfferTraitChoice(candidate.set,context))return choices;
 const template=chooseFreshTraitTemplate(candidate.templates);
 choices.push(buildInjectedTraitChoice(candidate.set,template,context,candidate.activeTrait));
 return choices;
}
