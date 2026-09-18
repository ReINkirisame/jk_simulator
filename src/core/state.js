"use strict";

// 所有会影响流程的数据都集中在这里。
// 后续加入存档时，只需要序列化这个对象，而不必扫描页面元素。
let S={
 name:"",month:9,term:"高一上",phase:"setup",
 traits:[],pool:[],stats:{charm:10,intel:10,health:10,money:10},
 interests:[],club:null,route:null,division:null,
 birthdayMonth:1,birthdayDay:1,npcs:[],npcRelation:{},
 usedRandom:[],usedRoute:{},history:[],flags:{},exam:{},examDetails:{},
 traitProgress:{},hiddenTraits:[],
 traitChoiceState:{misses:0,lastEventId:null,recentChoiceIds:[]},
 tendencies:{},choiceHistory:[],memories:[],checks:[],npcImpressions:{}
};

function $(id){return document.getElementById(id)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

// 所有随机结果都从这里取得。测试可以临时替换随机源，游戏内容不要直接调用 Math.random。
let GAME_RANDOM_SOURCE=()=>Math.random();
function gameRandom(){
 const value=Number(GAME_RANDOM_SOURCE());
 return Number.isFinite(value)?Math.max(0,Math.min(0.999999999999,value)):0;
}
function setGameRandomSource(source){GAME_RANDOM_SOURCE=typeof source==="function"?source:()=>Math.random()}
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
function log(t){const b=$("log");b.innerHTML+=`<p>· ${esc(t)}</p>`;b.scrollTop=b.scrollHeight}
function addInterest(t){if(!S.interests.includes(t)){S.interests.push(t);log("获得兴趣标签：【"+t+"】")}}
function changeStat(key,delta,reason=""){
 if(!Object.prototype.hasOwnProperty.call(S.stats,key))return 0;
 const before=Number(S.stats[key])||0;
 const after=Math.max(0,Math.min(40,before+delta));
 S.stats[key]=after;
 const actual=after-before;
 if(actual)log(`${reason?reason+"；":""}${{charm:"魅力",intel:"智力",health:"健康",money:"家境"}[key]||key}${actual>0?"+":""}${actual}。`);
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
   log("认识了【"+name+"】。");
   return true;
 }
 if(!Number.isFinite(Number(S.npcRelation[name])))S.npcRelation[name]=initialRelation;
 return false;
}
function changeRelation(name,delta,reason=""){
 ensureNpc(name,1);
 const before=getRelation(name);
 const after=Math.max(-5,Math.min(12,before+delta));
 S.npcRelation[name]=after;
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
 const record={eventId,choiceId,label,term:S.term,month:S.month};
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
function val(id){const n=parseInt($(id).value,10);return Number.isFinite(n)?Math.max(0,Math.min(40,n)):0}
function pointsOK(){return val("iCharm")+val("iIntel")+val("iHealth")+val("iMoney")===40}
["iCharm","iIntel","iHealth","iMoney"].forEach(id=>$(id).addEventListener("input",()=>{
 $("remain").textContent=40-val("iCharm")-val("iIntel")-val("iHealth")-val("iMoney");
}));
