"use strict";
const assert=require("node:assert/strict");
const {runtime}=require("./test-runtime");
const profiles=[
 {name:"balanced",stats:[8,8,8,8,8],family:"ordinary",seed:"101"},
 {name:"academic",stats:[20,20,0,0,0],family:"modest",seed:"202"},
 {name:"appearance",stats:[0,0,0,20,20],family:"wealthy",seed:"303"},
 {name:"athletic",stats:[0,0,20,20,0],family:"modest",seed:"404"},
 {name:"chaos",stats:[8,8,8,8,8],family:"ordinary",seed:"505",chaos:true},
 {name:"selective-chaos",stats:[8,8,8,8,8],family:"ordinary",seed:"606",chaos:true},
 {name:"music-growth",stats:[8,8,8,16,0],family:"ordinary",seed:"707",traits:["社恐","吉他手","认真"],traitPlay:true},
 {name:"ice-growth",stats:[20,4,8,8,0],family:"ordinary",seed:"808",traits:["完美主义","冰山","认真"],traitPlay:true},
 {name:"acquired-wave",stats:[8,8,8,8,8],family:"ordinary",seed:"909",traits:["癫佬","认真","运动少女"],traitPlay:true,formTrait:"电波"}
];
for(const profile of profiles){
 const r=runtime();r.launch({...profile,name:"测试角色"});
 let count=0,firstAcquiredXp=null;
 const seen=[],snapshotChecks=new Set([30,100,190]);
 for(;count<380&&r.state().phase!=="graduated";count++){
  const s=r.state();seen.push(s.calendarIndex);
  if(s.hiddenTraits.includes("古明地恋"))assert(s.flags.koishiAwakenedAt.index>=16,"synthesized before winter of year 2");
  assert(s.hiddenTraits.every(name=>name==="古明地恋"),"disabled hidden character became active");
  assert((s.fusionHistory||[]).every(record=>record.trait==="古明地恋"),"disabled hidden fusion was offered");
  assert((s.acquiredTraits||[]).length<=2,"too many acquired traits");
  const list=r.buttons();
  let b=null;
  if(profile.formTrait&&!s.acquiredTraits.includes(profile.formTrait))b=list.find(x=>x.textContent.includes("自己的做法"))||list.find(x=>x.textContent.includes("把跳过前提的联想"))||list.find(x=>x.textContent.startsWith("把它保留下来："+profile.formTrait));
  if(!b&&(profile.chaos||profile.traitPlay))b=list.find(x=>x.classList.contains("trait-choice"));
  if(profile.name==="selective-chaos"&&s.month%4===0)b=list.find(x=>!x.classList.contains("trait-choice"));
  // 一些路径故意选择不同方式与失败补救，不总取第一个。
  if(!b)b=list[profile.name==="balanced"||profile.chaos?0:count%list.length];
  assert(b,"stuck at "+r.elements.title.textContent);b.click();
  if(profile.formTrait&&firstAcquiredXp===null&&r.state().acquiredTraits.includes(profile.formTrait))firstAcquiredXp=r.run("getTraitXp("+JSON.stringify(profile.formTrait)+")");
  if(snapshotChecks.has(count)){
   const before=r.json("S"),save=r.json("savePayload()");
   r.run("restoreGame("+JSON.stringify(save)+");");
   assert.deepEqual(r.json("S"),before,"save did not restore same page/state");
  }
 }
 const state=r.state();
 assert.equal(state.phase,"graduated",profile.name+" did not graduate");
 assert.equal(new Set(seen).size,34,"calendar skipped a month");
 assert.equal(state.calendarIndex,33);
 assert(state.flags.octoberPortraitShown&&state.flags.lanternStyle&&state.examDetails.monthly);
 assert.equal(state.habits.configured,true,"habit setup was skipped");
 assert.equal(state.habits.history.filter(item=>item.mode==="initial"&&item.slot!=="socialFocus").length,3,"initial habits should be configured exactly once");
 assert.equal(state.flags.seniorHabitsLocked,true,"senior habit lock was skipped");
 assert.equal(state.habits.locked.length,2,"senior year should lock two habit slots");
 assert(state.forumPosts.length>=30,"forum did not accumulate enough school-life posts");
 assert(state.project?.result,"project has no conclusion");
 assert(state.exam.graduation>=180&&state.exam.graduation<=735);
 assert.equal(Object.keys(state.stats).length,5);
 assert(Object.values(state.stats).every(n=>Number.isFinite(n)&&n>=0&&n<=30));
 assert.equal(state.stats.appearance,profile.stats[4],"ordinary activity changed appearance");
 assert(state.resources.energy>=0&&state.resources.stress<=100&&state.resources.cash>=0);
 assert(state.choiceHistory.length>=35);
 if(profile.formTrait){
  assert(state.acquiredTraits.includes(profile.formTrait),"ordinary gameplay could not form the missing source trait");
  const acquired=state.traitFormationHistory.find(item=>item.type==="acquired"&&item.trait===profile.formTrait);
  assert(acquired&&acquired.index>=6,"formed before the first eligible month");
  assert(new Set(acquired.evidenceMonths).size>=4,"formed without four distinct evidence months");
  assert.equal(firstAcquiredXp,0,"formation evidence was incorrectly converted into growth XP");
 }
 assert.equal(r.errors.length,0,JSON.stringify(r.errors));
 assert.equal(r.alerts.length,0,JSON.stringify(r.alerts));
 const saved=r.json("savePayload()");
 r.run("restoreGame("+JSON.stringify(saved)+")");
 assert.deepEqual(r.json("S"),state,"graduation save mismatch");
 console.log(profile.name+": "+count+" clicks; exam "+state.exam.graduation+"; project "+state.project.result+"; rumors "+state.rumors.length+"; evolution "+JSON.stringify(state.flags.koishiAwakenedAt||null));
}
