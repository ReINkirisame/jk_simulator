"use strict";

const GAME_VERSION="0.6.2";

/**
 * 开发期的轻量内容检查。
 * 它不会阻止游戏启动，只会在浏览器控制台指出明显的数据问题。
 */
function validateGameData(){
 const warnings=[];
 const traitNames=TRAITS.map(item=>item[0]);
 const duplicates=traitNames.filter((name,index)=>traitNames.indexOf(name)!==index);
 if(duplicates.length)warnings.push("重复特质："+[...new Set(duplicates)].join("、"));
 if(traitNames.some(name=>["intro","effect","quote"].some(key=>!TRAIT_TEXTS[name]?.[key])))warnings.push("四段式特质文本缺失");
 if(traitNames.length!==60||traitNames.some(name=>!TRAIT_PROFILES[name]?.category||!TRAIT_PROFILES[name]?.skill||!traitEffectDescription(name)))warnings.push("普通特质分类或作用说明缺失");
 if(Object.keys(HIDDEN_TRAITS).length!==1||FUSION_RECIPES.length!==1||enabledFusionRecipes()[0]?.hidden!=="古明地恋")warnings.push("隐藏角色与配方应只保留古明地恋");

 Object.entries(NPCS).forEach(([name,npc])=>{
   if(!npc||!npc.desc||!npc.tag)warnings.push(`NPC「${name}」缺少描述或标签。`);
 });

 const traitChoiceIds=[];
 TRAIT_CHOICE_SETS.forEach(set=>{
   if(set.hidden?!HIDDEN_TRAITS[set.trait]:!traitNames.includes(set.trait))warnings.push(`特质选项组「${set.id}」引用了不存在的特质「${set.trait}」。`);
   if(!TRAIT_CHOICE_RESOLVERS[set.resolver])warnings.push(`特质选项组「${set.id}」缺少效果处理器。`);
   (set.choices||[]).forEach(choice=>{
     if(!choice.id||!choice.label)warnings.push(`特质选项组「${set.id}」存在缺少 id 或文字的选项。`);
     if(choice.id)traitChoiceIds.push(choice.id);
   });
 });
 const repeatedChoiceIds=traitChoiceIds.filter((id,index)=>traitChoiceIds.indexOf(id)!==index);
 if(repeatedChoiceIds.length)warnings.push("重复特质选项 ID："+[...new Set(repeatedChoiceIds)].join("、"));
 const hiddenNames=Object.keys(HIDDEN_TRAITS),usedSources=[];
 FUSION_RECIPES.forEach(recipe=>{
  if(!hiddenNames.includes(recipe.hidden)||recipe.sources.length!==2||recipe.sources.some(name=>!traitNames.includes(name)))warnings.push("隐藏特质合成定义不完整："+recipe.id);
  recipe.sources.forEach(name=>usedSources.push(recipe.id+":"+name));
 });
 if(new Set(FUSION_RECIPES.map(recipe=>recipe.hidden)).size!==FUSION_RECIPES.length)warnings.push("隐藏特质合成结果重复");

 const eventGroups=[
   ...Object.values(FIXED),
   ...Object.values(SECOND_FIXED),
   ...Object.values(ROUTES),
   RANDOM_EVENTS
 ];
 const eventIds=[];
 eventGroups.flat().forEach((event,index)=>{
   if(!event||!event.title)warnings.push(`第 ${index+1} 个事件缺少标题。`);
   if(event&&event.id)eventIds.push(event.id);
   if(event&&!Array.isArray(event.choices)&&typeof event.getChoices!=="function")warnings.push(`事件「${event.title||index+1}」缺少 choices 或 getChoices。`);
 });
 const repeatedEventIds=eventIds.filter((id,index)=>eventIds.indexOf(id)!==index);
 if(repeatedEventIds.length)warnings.push("重复事件 ID："+[...new Set(repeatedEventIds)].join("、"));
 const storyEvents=[PHOTO_EVENT,...Object.values(Y2_EVENTS),...Object.values(Y3_EVENTS)];
 storyEvents.forEach(event=>warnings.push(...validateStoryEvent(event)));
 const storyIds=storyEvents.map(event=>event.id);
 if(new Set(storyIds).size!==storyIds.length)warnings.push("新事件ID重复");
 if(CALENDAR.length!==34||CALENDAR[16].year!==2||CALENDAR[16].month!==1)warnings.push("日历或高二寒假门槛错误");
 HABIT_SLOT_ORDER.forEach(slot=>{
   if(!HABIT_SLOTS[slot]||Object.keys(HABITS[slot]||{}).length<3)warnings.push("生活习惯分类缺失："+slot);
 });
 const rumorIds=RUMOR_DEFS.map(item=>item.id);
 if(RUMOR_DEFS.length!==12)warnings.push("应提供12条校园传闻");
 if(new Set(rumorIds).size!==rumorIds.length)warnings.push("校园传闻ID重复");
 RUMOR_DEFS.forEach(item=>{
   if(!item.id||typeof item.when!=="function"||!item.title||!item.summary||!item.forum)warnings.push("校园传闻定义不完整："+(item.id||"unknown"));
 });
 const forumIds=FORUM_POST_TEMPLATES.map(item=>item.id);
 if(new Set(forumIds).size!==forumIds.length)warnings.push("校园论坛模板ID重复");

 // v0.4 纵向样板：九、十月的每一个选项都应留下可追踪的选择标识和影响说明。
 [...FIXED[9],...FIXED[10]].forEach(event=>{
   const choices=typeof event.getChoices==="function"?event.getChoices():event.choices;
   (choices||[]).forEach((choice,index)=>{
     const meta=choice&&choice[3];
     if(!meta||!meta.id)warnings.push(`九十月事件「${event.title}」第 ${index+1} 个选项缺少持久化 id。`);
     if(!meta||!meta.impact)warnings.push(`九十月事件「${event.title}」第 ${index+1} 个选项缺少影响说明。`);
   });
 });

 if(warnings.length)console.warn("[女高模拟器：内容检查]",warnings);
 return warnings;
}

// 方便开发时在浏览器控制台检查当前状态，不参与正常游戏流程。
globalThis.GameDebug=Object.freeze({
 version:GAME_VERSION,
 getState:()=>JSON.parse(JSON.stringify(S)),
 validate:validateGameData,
 check:options=>{S.debug=true;return resolveCheck(options);},
 jump:debugJump,
 prepareChaos:debugPrepareChaos,
 prepareFusion:debugPrepareFusion,
 evolution:chaosEvolutionEligibility,
 fusions:fusionStatus,
 traits:()=>JSON.parse(JSON.stringify(S.traitJourneys)),
 formation:traitFormationSummary,
 habits:()=>JSON.parse(JSON.stringify(S.habits)),
 rumors:()=>JSON.parse(JSON.stringify(S.rumors)),
 setStat:(key,value)=>{if(ATTRIBUTES[key]&&Number.isInteger(value)&&value>=0&&value<=(key==="appearance"?20:30)){S.debug=true;S.stats[key]=value;update();}}
});

validateGameData();
const initialSeed="campus-"+Date.now().toString(36);
setGameSeed(initialSeed);
$("seedInput").value=initialSeed;
renderPool();
Object.values(ATTRIBUTES).forEach(rule=>$(rule.input).addEventListener("input",refreshAllocation));
$("debugMonth").innerHTML=CALENDAR.map((p,index)=>'<option value="'+index+'">'+p.term+" "+p.month+"月</option>").join("");
refreshAllocation();refreshFamily();
try{$("resumeSetup").disabled=!localStorage.getItem(SAVE_KEY);}catch{$("resumeSetup").disabled=true;}
update();
