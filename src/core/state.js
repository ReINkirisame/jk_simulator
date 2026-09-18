"use strict";

// 所有会影响流程的数据都集中在这里。
// 后续加入存档时，只需要序列化这个对象，而不必扫描页面元素。
let S={
 name:"",month:9,term:"高一上",phase:"setup",
 traits:[],pool:[],stats:{charm:10,intel:10,health:10,money:10},
 interests:[],club:null,route:null,division:null,
 birthdayMonth:1,birthdayDay:1,npcs:[],npcRelation:{},
 usedRandom:[],usedRoute:{},history:[],flags:{},exam:{},
 traitProgress:{},hiddenTraits:[],
 traitChoiceState:{misses:0,lastEventId:null,recentChoiceIds:[]}
};

function $(id){return document.getElementById(id)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function shuffle(a){return [...a].sort(()=>Math.random()-0.5)}
function hasTrait(t){
 return S.traits.some(i=>S.pool[i]&&S.pool[i][0]===t)||(Array.isArray(S.hiddenTraits)&&S.hiddenTraits.includes(t));
}
function hasInterest(t){return S.interests.includes(t)}
function hasTag(t){return hasTrait(t)||hasInterest(t)}
function log(t){const b=$("log");b.innerHTML+=`<p>· ${esc(t)}</p>`;b.scrollTop=b.scrollHeight}
function addInterest(t){if(!S.interests.includes(t)){S.interests.push(t);log("获得兴趣标签：【"+t+"】")}}
function val(id){const n=parseInt($(id).value,10);return Number.isFinite(n)?Math.max(0,Math.min(40,n)):0}
function pointsOK(){return val("iCharm")+val("iIntel")+val("iHealth")+val("iMoney")===40}
["iCharm","iIntel","iHealth","iMoney"].forEach(id=>$(id).addEventListener("input",()=>{
 $("remain").textContent=40-val("iCharm")-val("iIntel")-val("iHealth")-val("iMoney");
}));
