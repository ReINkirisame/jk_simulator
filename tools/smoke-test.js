"use strict";
const assert=require("node:assert/strict");
const {runtime}=require("./test-runtime");
const profiles=[
 {name:"balanced",stats:[8,8,8,8,8],family:"ordinary",seed:"101"},
 {name:"academic",stats:[20,20,0,0,0],family:"modest",seed:"202"},
 {name:"appearance",stats:[0,0,0,20,20],family:"wealthy",seed:"303"},
 {name:"athletic",stats:[0,0,20,20,0],family:"modest",seed:"404"},
 {name:"chaos",stats:[8,8,8,8,8],family:"ordinary",seed:"505",chaos:true},
 {name:"selective-chaos",stats:[8,8,8,8,8],family:"ordinary",seed:"606",chaos:true}
];
for(const profile of profiles){
 const r=runtime();r.launch({...profile,name:"测试角色"});
 let count=0;
 const seen=[],snapshotChecks=new Set([30,100,190]);
 for(;count<380&&r.state().phase!=="graduated";count++){
  const s=r.state();seen.push(s.calendarIndex);
  if(s.hiddenTraits.includes("古明地恋"))assert(s.flags.koishiAwakenedAt.index>=16,"evolved before winter of year 2");
  const list=r.buttons();
  let b=profile.chaos?list.find(x=>x.classList.contains("trait-choice")):null;
  if(profile.name==="selective-chaos"&&s.month%4===0)b=list.find(x=>!x.classList.contains("trait-choice"));
  // 一些路径故意选择不同方式与失败补救，不总取第一个。
  if(!b)b=list[profile.name==="balanced"||profile.chaos?0:count%list.length];
  assert(b,"stuck at "+r.elements.title.textContent);b.click();
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
 assert(state.exam.graduation>=300&&state.exam.graduation<=750);
 assert.equal(Object.keys(state.stats).length,5);
 assert(Object.values(state.stats).every(n=>Number.isFinite(n)&&n>=0&&n<=30));
 assert.equal(state.stats.appearance,profile.stats[4],"ordinary activity changed appearance");
 assert(state.resources.energy>=0&&state.resources.stress<=100&&state.resources.cash>=0);
 assert(state.choiceHistory.length>=35);
 assert.equal(r.errors.length,0,JSON.stringify(r.errors));
 assert.equal(r.alerts.length,0,JSON.stringify(r.alerts));
 const saved=r.json("savePayload()");
 r.run("restoreGame("+JSON.stringify(saved)+")");
 assert.deepEqual(r.json("S"),state,"graduation save mismatch");
 console.log(profile.name+": "+count+" clicks; exam "+state.exam.graduation+"; project "+state.project.result+"; rumors "+state.rumors.length+"; evolution "+JSON.stringify(state.flags.koishiAwakenedAt||null));
}
