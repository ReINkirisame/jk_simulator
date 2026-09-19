"use strict";

// 所有会影响流程的数据都集中在这里。
// 存档通过种子与操作重放恢复状态及当前事件闭包，并校验这个对象。
function freshState(){return {
 name:"",year:1,month:9,term:"高一上",phase:"setup",calendarIndex:0,
 traits:[],pool:[],stats:{academic:8,expression:8,fitness:8,creativity:8,appearance:8},
 initialStats:{},family:"ordinary",resources:{cash:0,energy:70,stress:15},
 growth:{xp:{},semester:{}},npcTrust:{},npcFamiliarity:{},journal:[],
 rng:{seed:"",state:1},project:null,examArchive:[],debug:false,
 interests:[],club:null,route:null,division:null,
 birthdayMonth:1,birthdayDay:1,npcs:[],npcRelation:{},
 usedRandom:[],usedRoute:{},history:[],flags:{},exam:{},examDetails:{},
 traitProgress:{},hiddenTraits:[],
 traitChoiceState:{misses:0,lastEventId:null,recentChoiceIds:[]},
 tendencies:{},choiceHistory:[],memories:[],checks:[],npcImpressions:{},
 traitMilestones:{months:[],npcs:[],scenes:[]},
 habits:{study:null,afterschool:null,recovery:null,tenure:{study:0,afterschool:0,recovery:0},history:[],configured:false,locked:[],flexible:null,socialFocus:null},
 rumors:[],forumPosts:[]
};}
let S=freshState();

function $(id){return document.getElementById(id)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

// 所有随机结果都从这里取得。测试可以临时替换随机源，游戏内容不要直接调用 Math.random。
let GAME_RANDOM_SOURCE=null;
function seedNumber(text){
 let value=2166136261;
 for(const c of String(text)){value=Math.imul(value^c.charCodeAt(0),16777619)>>>0;}
 return value||1;
}
function setGameSeed(seed){S.rng={seed:String(seed),state:seedNumber(seed)};GAME_RANDOM_SOURCE=null;}
function gameRandom(){
 let value;
 if(GAME_RANDOM_SOURCE)value=Number(GAME_RANDOM_SOURCE());
 else {S.rng.state=(Math.imul(S.rng.state,1664525)+1013904223)>>>0;value=S.rng.state/4294967296;}
 return Number.isFinite(value)?Math.max(0,Math.min(0.999999999999,value)):0;
}
function setGameRandomSource(source){GAME_RANDOM_SOURCE=typeof source==="function"?source:null}
function randomInt(min,max){return Math.floor(gameRandom()*(max-min+1))+min}
function randomItem(items){return Array.isArray(items)&&items.length?items[randomInt(0,items.length-1)]:null}
function shuffle(items){
 const result=[...items];
 for(let i=result.length-1;i>0;i-=1){
   const j=randomInt(0,i);
   [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}
function hasTrait(t){
 return S.traits.some(i=>S.pool[i]&&S.pool[i][0]===t)||(Array.isArray(S.hiddenTraits)&&S.hiddenTraits.includes(t));
}
function hasInterest(t){return S.interests.includes(t)}
function hasTag(t){return hasTrait(t)||hasInterest(t)}
function log(t){S.journal.push(String(t));const b=$("log");b.innerHTML+=`<p>· ${esc(t)}</p>`;b.scrollTop=b.scrollHeight}
function addInterest(t){if(!S.interests.includes(t)){S.interests.push(t);log("获得兴趣标签：【"+t+"】")}}
function changeStat(key,delta,reason=""){
 if(!Object.prototype.hasOwnProperty.call(S.stats,key))return 0;
 const before=Number(S.stats[key])||0;
 const initial=Number(S.initialStats.appearance??before);
 const floor=key==="appearance"?Math.max(0,initial-ATTRIBUTE_RULES.appearanceDrift):0;
 const ceiling=key==="appearance"?Math.min(22,initial+ATTRIBUTE_RULES.appearanceDrift):ATTRIBUTE_RULES.growthMax;
 const after=Math.max(floor,Math.min(ceiling,before+delta));
 S.stats[key]=after;
 const actual=after-before;
 if(actual)log(`${reason?reason+"；":""}${ATTRIBUTES[key]?.label||key}${actual>0?"+":""}${actual}。`);
 return actual;
}
function getRelation(name){
 const value=Number(S.npcRelation[name]);
 return Number.isFinite(value)?value:1;
}
function ensureNpc(name,initialRelation=1){
 if(!name||!NPCS[name])return false;
 if(!S.npcs.includes(name)){
   S.npcs.push(name);
   S.npcRelation[name]=initialRelation;
   S.npcTrust[name]=0;S.npcFamiliarity[name]=1;
   log("认识了【"+name+"】。");
   return true;
 }
 if(!Number.isFinite(Number(S.npcRelation[name])))S.npcRelation[name]=initialRelation;
 return false;
}
function changeRelation(name,delta,reason=""){
 if(!NPCS[name])return 0;
 ensureNpc(name,1);
 const before=getRelation(name);
 const after=Math.max(-5,Math.min(12,before+delta));
 S.npcRelation[name]=after;
 if(delta>0)S.npcFamiliarity[name]=Math.min(30,(S.npcFamiliarity[name]||1)+1);
 const actual=after-before;
 if(actual)log(`${reason?reason+"；":""}和【${name}】的关系${actual>0?"+":""}${actual}。`);
 return actual;
}
function addTendency(name,amount=1){
 if(!name)return;
 if(!S.tendencies||typeof S.tendencies!=="object")S.tendencies={};
 S.tendencies[name]=(Number(S.tendencies[name])||0)+amount;
}
function rememberChoice(eventId,choiceId,label,tags=[],impact=""){
 if(!Array.isArray(S.choiceHistory))S.choiceHistory=[];
 if(!Array.isArray(S.memories))S.memories=[];
 const record={eventId,choiceId,label,tags:Array.isArray(tags)?[...tags]:[],term:S.term,month:S.month,calendarIndex:S.calendarIndex};
 S.choiceHistory.push(record);
 (Array.isArray(tags)?tags:[]).forEach(tag=>addTendency(tag));
 if(impact){
   rememberImpact(eventId,impact);
 }
}
function rememberImpact(eventId,impact){
 if(!impact)return;
 if(!Array.isArray(S.memories))S.memories=[];
 S.memories.push({eventId,text:impact,term:S.term,month:S.month});
 log("留下影响："+impact+"。");
}
function val(id){const raw=$(id).value;return String(raw).trim()===""?NaN:Number(raw)}
function allocatedStats(){return Object.fromEntries(Object.entries(ATTRIBUTES).map(([key,rule])=>[key,val(rule.input)]))}
function allocationError(stats=allocatedStats()){
 if(Object.values(stats).some(value=>!Number.isInteger(value)||value<0||value>ATTRIBUTE_RULES.initialMax))return "每项必须是0～20的整数；空白、小数和超限值都不能开始。";
 if(Object.values(stats).reduce((sum,value)=>sum+value,0)!==ATTRIBUTE_RULES.budget)return "五项属性合计必须正好为40。";
 return "";
}
function pointsOK(){return !allocationError()}
function refreshAllocation(){
 const stats=allocatedStats();
 const total=Object.values(stats).reduce((sum,value)=>sum+(Number.isFinite(value)?value:0),0);
 $("remain").textContent=ATTRIBUTE_RULES.budget-total;
 $("allocationMessage").textContent=allocationError(stats)||"点数分配完成。0表示明显短板，不会使主线无法继续。";
 $("allocationMessage").classList.toggle("error-text",Boolean(allocationError(stats)));
}
function setAllocation(values){Object.values(ATTRIBUTES).forEach((rule,index)=>{$(rule.input).value=values[index];});refreshAllocation();}
function randomAllocation(){
 const values=[0,0,0,0,0];
 for(let i=0;i<ATTRIBUTE_RULES.budget;i+=1){const candidates=values.map((v,index)=>v<20?index:-1).filter(index=>index>=0);values[randomItem(candidates)]+=1;}
 // 随机转移合法点数，使随机角色不只集中在8附近。
 for(let i=0;i<30;i+=1){const a=randomInt(0,4),b=randomInt(0,4);if(values[a]>0&&values[b]<20){values[a]-=1;values[b]+=1;}}
 setAllocation(values);
}
function changeResource(key,delta,reason=""){
 if(!Object.hasOwn(S.resources,key)||!Number.isFinite(delta))return 0;
 const before=S.resources[key],ceiling=key==="cash"?9999:100;
 S.resources[key]=Math.max(0,Math.min(ceiling,before+delta));
 const actual=S.resources[key]-before;
 if(actual)log(`${reason?reason+"；":""}${{cash:"零花钱",energy:"精力",stress:"压力"}[key]}${actual>0?"+":""}${actual}。`);
 return actual;
}
function spendCash(amount,reason){if(S.resources.cash<amount)return false;changeResource("cash",-amount,reason);return true;}
function changeTrust(name,delta,reason=""){
 if(!ensureNpc(name,1)&&!NPCS[name])return 0;
 const before=S.npcTrust[name]||0;
 S.npcTrust[name]=Math.max(-5,Math.min(12,before+delta));
 if(S.npcTrust[name]!==before)log(`${reason?reason+"；":""}【${name}】信任${formatSigned(S.npcTrust[name]-before)}。`);
 return S.npcTrust[name]-before;
}
function growthTerm(){return `${S.year}:${S.month>=9||S.month<=2?"上":"下"}`;}
function gainExperience(key,amount=1,reason="活动积累"){
 if(!ATTRIBUTES[key]||key==="appearance"||amount<=0)return 0;
 const term=growthTerm(),used=S.growth.semester[term]||(S.growth.semester[term]={});
 if((used[key]||0)>=ATTRIBUTE_RULES.semesterGrowthCap||S.stats[key]>=ATTRIBUTE_RULES.growthMax)return 0;
 S.growth.xp[key]=(S.growth.xp[key]||0)+amount;
 log(`${reason}；${ATTRIBUTES[key].label}经验+${amount}。`);
 let raised=0;
 while(S.growth.xp[key]>=ATTRIBUTE_RULES.xpPerLevel&&(used[key]||0)<ATTRIBUTE_RULES.semesterGrowthCap&&S.stats[key]<ATTRIBUTE_RULES.growthMax){
  S.growth.xp[key]-=ATTRIBUTE_RULES.xpPerLevel;used[key]=(used[key]||0)+1;raised+=changeStat(key,1,"练习积累成了能力");
 }
 if((used[key]||0)>=ATTRIBUTE_RULES.semesterGrowthCap||S.stats[key]>=ATTRIBUTE_RULES.growthMax)S.growth.xp[key]=0;
 return raised;
}
function monthKey(){return `${S.year}:${S.month}`;}
