"use strict";

function normalizeSchoolLifeState(){
 if(!S.habits||typeof S.habits!=="object"){
  S.habits={study:null,afterschool:null,recovery:null,tenure:{study:0,afterschool:0,recovery:0},history:[],configured:false,locked:[],flexible:null,socialFocus:null};
 }
 if(!S.habits.tenure)S.habits.tenure={study:0,afterschool:0,recovery:0};
 if(!Array.isArray(S.habits.history))S.habits.history=[];
 if(!Array.isArray(S.habits.locked))S.habits.locked=[];
 if(!Array.isArray(S.rumors))S.rumors=[];
 if(!Array.isArray(S.forumPosts))S.forumPosts=[];
}
function choiceCount(test){
 return (S.choiceHistory||[]).filter(test).length;
}
function habitTenure(slot){
 normalizeSchoolLifeState();
 return Number(S.habits.tenure[slot])||0;
}
function trustedNpcCount(minimum=3){
 return Object.values(S.npcTrust||{}).filter(value=>Number(value)>=minimum).length;
}
function habitDefinition(slot,id){
 return HABITS[slot]&&HABITS[slot][id]||null;
}
function habitStatus(slot){
 if(!S.habits[slot])return "未设置";
 return habitTenure(slot)>=2?"稳定":"磨合中";
}
function habitSummaryText(){
 normalizeSchoolLifeState();
 return HABIT_SLOT_ORDER.map(slot=>{
  const item=habitDefinition(slot,S.habits[slot]);
  return HABIT_SLOTS[slot].label+"："+(item?item.label:"未设置")+"（"+habitStatus(slot)+"）";
 }).join(" · ");
}
function setHabit(slot,id,mode="initial"){
 normalizeSchoolLifeState();
 if(!habitDefinition(slot,id))throw new Error("未知生活习惯："+slot+"/"+id);
 const before=S.habits[slot];
 if(before===id)return false;
 if(S.year===3&&S.habits.locked.includes(slot))throw new Error("这一部分日常已经在高三锁定。");
 if(S.habits.configured&&before){
  const senior=S.year===3;
  changeResource("energy",senior?-6:-3,"调整已有习惯");
  changeResource("stress",senior?8:4,"重新适应节奏");
 }
 S.habits[slot]=id;
 S.habits.tenure[slot]=0;
 S.habits.history.push({slot,from:before,to:id,mode,year:S.year,month:S.month,index:S.calendarIndex});
 if(slot==="afterschool"&&id!=="people")S.habits.socialFocus=null;
 return true;
}
function ensureDefaultHabits(){
 normalizeSchoolLifeState();
 if(S.habits.configured)return;
 const strongest=Object.keys(ATTRIBUTES).filter(key=>key!=="appearance").sort((a,b)=>S.stats[b]-S.stats[a])[0];
 S.habits.study=strongest==="academic"?"timed":"foundation";
 S.habits.afterschool=S.project?"project":strongest==="creativity"?"ownwork":"club";
 S.habits.recovery=strongest==="fitness"?"exercise":"sleep";
 S.habits.tenure={study:2,afterschool:2,recovery:2};
 S.habits.configured=true;
}
function setSocialFocus(name,changing=false){
 normalizeSchoolLifeState();
 if(!NPCS[name])return false;
 ensureNpc(name,1);
 if(changing&&S.habits.socialFocus&&S.habits.socialFocus!==name){
  changeResource("energy",-2,"重新安排见面");
  changeResource("stress",3,"改变固定联系");
 }
 S.habits.socialFocus=name;
 S.habits.history.push({slot:"socialFocus",to:name,mode:changing?"review":"initial",year:S.year,month:S.month,index:S.calendarIndex});
 return true;
}
function renderHabitButtons(tag,title,textValue,items,keyPrefix,onChoose){
 resetScreenActions();
 $("effectFeedback").innerHTML="";
 $("tag").textContent=tag;
 $("title").textContent=title;
 $("text").textContent=textValue;
 const box=$("choices");box.innerHTML="";
 items.forEach(item=>{
  const button=document.createElement("button");
  button.type="button";
  button.textContent=item.label;
  if(item.hint)button.title=item.hint;
  if(item.disabled)button.disabled=true;
  if(!button.disabled)bindAction(button,keyPrefix+":"+item.id,()=>{box.innerHTML="";onChoose(item.id);});
  box.appendChild(button);
 });
 update();
}
function showSocialFocusPicker(done,changing=false){
 normalizeSchoolLifeState();
 if(!S.npcs.length)ensureNpc("班长",1);
 const candidates=S.npcs.filter(name=>!changing||name!==S.habits.socialFocus);
 if(!candidates.length){done();return;}
 renderHabitButtons("高二 · 生活习惯","固定把时间留给谁","这不是一次随机碰面。之后的日常会更常把你带到这个人身边；更换对象也需要重新安排时间。",
  candidates.map(name=>({id:name,label:name+" · "+(NPCS[name].tag||"已经认识的人")})),
  "habit-focus",name=>{setSocialFocus(name,changing);done();});
}
function showHabitSummary(done,title="新的日常开始了"){
 showContinueScreen("生活习惯",title,habitSummaryText()+"\n\n习惯每月自动产生效果。维持两个月后进入稳定状态；高二可以在复盘节点更换一项。","继续这个月",done);
}
function showHabitPickerSequence(slots,index,done,mode="initial",finishTitle="新的日常开始了"){
 if(index>=slots.length){
  S.habits.configured=true;
  const finish=()=>showHabitSummary(done,finishTitle);
  if(S.habits.afterschool==="people"&&!S.habits.socialFocus)showSocialFocusPicker(finish,false);
  else finish();
  return;
 }
 const slot=slots[index];
 const items=Object.entries(HABITS[slot]).map(([id,item])=>({id,label:item.label+" · "+item.desc,disabled:mode!=="initial"&&S.habits[slot]===id}));
 renderHabitButtons("高二 · 生活习惯",HABIT_SLOTS[slot].label,HABIT_SLOTS[slot].help+"\n\n这里只设置长期默认做法，不会把每一天拆成重复任务。",
  items,"habit-pick:"+mode+":"+slot,id=>{
   setHabit(slot,id,mode);
   const next=()=>showHabitPickerSequence(slots,index+1,done,mode,finishTitle);
   if(slot==="afterschool"&&id==="people")showSocialFocusPicker(next,Boolean(S.habits.socialFocus));
   else next();
  });
}
function showInitialHabitSetup(done){
 normalizeSchoolLifeState();
 showHabitPickerSequence(HABIT_SLOT_ORDER,0,()=>{
  applyHabitEffects();
  rememberImpact("habit-start","高二开始形成自己的生活习惯");
  done();
 },"initial","先这样生活一阵");
}
function finishHabitReview(reviewKey,done){
 S.flags["habitReview:"+reviewKey]=true;
 rememberImpact("habit-review:"+reviewKey,"重新检查了已经形成的生活习惯");
 showHabitSummary(done,S.year===3?"只调整了仍有余地的部分":"调整以后，再观察一段时间");
}
function showHabitReview(reviewKey,allowedSlots,done){
 normalizeSchoolLifeState();
 const senior=S.year===3;
 const items=[{id:"keep",label:"保持现在的全部安排 · 不产生适应代价"}];
 allowedSlots.forEach(slot=>items.push({id:slot,label:"调整"+HABIT_SLOTS[slot].label+" · 当前："+habitDefinition(slot,S.habits[slot]).label}));
 if(allowedSlots.includes("afterschool")&&S.habits.afterschool==="people"&&S.npcs.length>1)items.push({id:"focus",label:"只更换固定见面的人"});
 renderHabitButtons(senior?"高三 · 有限调整":"高二 · 阶段复盘",senior?"只动一个还能调整的部分":"现在的办法真的适合吗",
  (senior?"另外两项已经成为生活的底层。此时强行大改会付出明显的适应代价。":"一次只改一项，才能看清变化来自哪里。已经有效的部分可以原样保留。")+"\n\n"+habitSummaryText(),
  items,"habit-review:"+reviewKey,id=>{
   if(id==="keep"){finishHabitReview(reviewKey,done);return;}
   if(id==="focus"){showSocialFocusPicker(()=>finishHabitReview(reviewKey,done),true);return;}
   showHabitPickerSequence([id],0,()=>finishHabitReview(reviewKey,done),senior?"senior-review":"review","调整以后，再观察一段时间");
  });
}
function applyHabitEffects(){
 normalizeSchoolLifeState();
 if(!S.habits.configured||S.year<2)return false;
 const key="habitsApplied:"+monthKey();
 if(S.flags[key])return false;
 S.flags[key]=true;
 HABIT_SLOT_ORDER.forEach(slot=>{S.habits.tenure[slot]=(S.habits.tenure[slot]||0)+1;});
 switch(S.habits.study){
  case "foundation":gainExperience("academic",1,"每月基础复盘");changeResource("energy",-2);break;
  case "timed":gainExperience("academic",1,"限时训练");changeResource("energy",-4);changeResource("stress",2);break;
  case "gaps":gainExperience("academic",S.stats.academic<12?2:1,"按错因补缺");changeResource("energy",-4);break;
 }
 switch(S.habits.afterschool){
  case "project":
   if(S.project)gainExperience(S.project.skill,1,"长期项目积累");
   else gainExperience("creativity",1,"长期计划积累");
   changeResource("energy",-4);addTendency("投入");break;
  case "club":
   gainExperience(clubSkill(S.club),1,"固定参加社团");changeResource("energy",-3);changeResource("stress",-1);
   S.flags.clubAttendance=(S.flags.clubAttendance||0)+1;break;
  case "people":{
   gainExperience("expression",1,"保持固定联系");changeResource("energy",-2);changeResource("stress",-2);
   const name=S.habits.socialFocus;
   if(name&&habitTenure("afterschool")%2===0){changeRelation(name,1,"持续见面");S.flags.focusedMeetings=(S.flags.focusedMeetings||0)+1;}
   break;
  }
  case "ownwork":gainExperience("creativity",1,"持续个人作品");changeResource("energy",-3);changeResource("stress",-2);addTendency("创作");break;
 }
 switch(S.habits.recovery){
  case "sleep":changeResource("energy",8,"规律作息");changeResource("stress",-3);break;
  case "exercise":gainExperience("fitness",1,"固定运动");changeResource("energy",4);changeResource("stress",-3);break;
  case "online":changeResource("energy",-5,"深夜上网");changeResource("stress",-4);addTendency("网络化");break;
  case "quiet":changeResource("energy",5,"给自己留白");changeResource("stress",-6);addTendency("独处");break;
 }
 return true;
}
function habitExamEffects(){
 normalizeSchoolLifeState();
 if(!S.habits.configured||habitTenure("study")<2)return {check:0,score:0,label:"生活习惯仍在磨合"};
 if(S.habits.study==="foundation")return {check:0,score:7,label:"基础复盘"};
 if(S.habits.study==="timed")return {check:1,score:0,label:"限时训练"};
 if(S.habits.study==="gaps")return {check:0,score:S.stats.academic<12?9:4,label:"错因补缺"};
 return {check:0,score:0,label:"无"};
}
function habitProjectModifiers(){
 normalizeSchoolLifeState();
 if(!S.habits.configured||habitTenure("afterschool")<2)return [];
 const result=[];
 if(S.habits.afterschool==="project")result.push({label:"项目优先的日常",value:1});
 if(S.habits.afterschool==="people"&&S.project&&S.habits.socialFocus===S.project.partner)result.push({label:"和伙伴保持联系",value:1});
 return result;
}
function lockSeniorHabits(priority){
 ensureDefaultHabits();
 const flexible={study:"study",create:"afterschool",body:"recovery",people:"afterschool"}[priority]||"recovery";
 S.habits.flexible=flexible;
 S.habits.locked=HABIT_SLOT_ORDER.filter(slot=>slot!==flexible);
 S.flags.seniorPriority=priority;
 S.flags.seniorHabitsLocked=true;
 rememberImpact("senior-habits","高三保留了两项既有习惯，只给"+HABIT_SLOTS[flexible].label+"留下调整余地");
}

function addForumPost(post){
 normalizeSchoolLifeState();
 if(!post||!post.id||S.forumPosts.some(item=>item.id===post.id))return false;
 S.forumPosts.push(post);
 return true;
}
function createForumMonthPosts(){
 normalizeSchoolLifeState();
 if(S.year<2)return;
 const key=monthKey();
 if(S.flags["forumBuilt:"+key])return;
 S.flags["forumBuilt:"+key]=true;
 const eligible=FORUM_POST_TEMPLATES.filter(item=>!item.when||item.when());
 if(!eligible.length)return;
 const start=seedNumber(S.rng.seed+":forum:"+key)%eligible.length;
 for(let offset=0;offset<Math.min(2,eligible.length);offset+=1){
  const item=eligible[(start+offset)%eligible.length];
  addForumPost({id:"forum:"+key+":"+item.id,year:S.year,month:S.month,kind:"world",title:item.title(),text:item.text()});
 }
}
function addRumorForumPost(record){
 addForumPost({id:"forum:rumor:"+record.id,year:S.year,month:S.month,kind:"rumor",title:"【热帖】"+record.forum,text:"楼里没有写名字，但越来越多的细节让你觉得，她们说的就是你。"});
}
function resolveRumorDefinition(def){
 const read=value=>typeof value==="function"?value():value;
 return {id:def.id,title:read(def.title),summary:read(def.summary),npcLine:read(def.npcLine),forum:read(def.forum),
  discoveredIndex:S.calendarIndex,year:S.year,month:S.month,heard:false,response:null,strength:1,source:null,callbacks:[]};
}
function rumorSource(record){
 const excluded=record.id==="always-together"?S.habits.socialFocus:null;
 return S.npcs.find(name=>name!==excluded)||"隔壁班的女生";
}
function respondRumor(record,response){
 record.heard=true;record.response=response;
 if(response==="embrace"){record.strength=2;addTendency("自我演绎");changeResource("stress",-2,"不再反复解释传闻");}
 if(response==="clarify"){gainExperience("expression",1,"认真说明事实");changeResource("energy",-2);}
 if(response==="ignore"){changeResource("stress",-1,"让话题自己过去");}
 rememberChoice("rumor:"+record.id,response,{embrace:"顺水推舟",clarify:"认真澄清",ignore:"暂不回应"}[response],["传闻"]);
 rememberImpact("rumor:"+record.id,"校园里开始流传“"+record.title+"”");
}
function showRumor(record,done){
 record.source=record.source||rumorSource(record);
 const intro=record.source+"在楼梯口叫住你，犹豫了一会儿，才把最近听见的说法复述出来。\n\n“"+record.npcLine+"”\n\n这不是系统授予的称号。只是有些人已经开始用自己的方式解释你做过的事。";
 showChoices("校园传闻 · 别人嘴里的你","原来她们是这样说的",intro,[
  ["顺着她们的说法再添一点细节","既然故事已经传开，你干脆补上了一段只有自己知道是假的细节。",()=>{respondRumor(record,"embrace");return "新的版本当天下午就已经传得和原来不太一样。你不再完全控制这个故事，但至少参与了它怎样变形。";},{id:"embrace",protected:true}],
  ["把真正发生的部分解释清楚","你没有要求所有人闭嘴，只把最离谱的误解认真纠正。",()=>{respondRumor(record,"clarify");return "对方听懂了。至于她转述时能保留多少，已经是另一回事。";},{id:"clarify",protected:true}],
  ["先不回应，让它自己流动","你没有给这个说法追加正式版本。",()=>{respondRumor(record,"ignore");return "没有回应并没有让传闻立刻消失，却让它暂时停在一种谁也无法证实的状态。";},{id:"ignore",protected:true}]
 ],done,{eventId:"rumor:"+record.id,allowTraitChoices:false});
}
function tryCampusRumor(done){
 normalizeSchoolLifeState();
 if(S.year<2)return false;
 const pending=S.rumors.find(record=>!record.heard);
 if(pending){showRumor(pending,done);return true;}
 const last=S.rumors.at(-1);
 if(last&&S.calendarIndex-last.discoveredIndex<2)return false;
 const known=new Set(S.rumors.map(record=>record.id));
 const eligible=RUMOR_DEFS.filter(def=>!known.has(def.id)&&def.when()).sort((a,b)=>(b.priority||0)-(a.priority||0)||a.id.localeCompare(b.id));
 if(!eligible.length)return false;
 const record=resolveRumorDefinition(eligible[0]);
 S.rumors.push(record);addRumorForumPost(record);showRumor(record,done);return true;
}
function consumeRumorCallback(name){
 normalizeSchoolLifeState();
 const record=[...S.rumors].reverse().find(item=>item.heard&&item.callbacks.length<2&&!item.callbacks.includes(name));
 if(!record)return "";
 record.callbacks.push(name);
 const trust=S.npcTrust[name]||0;
 if(trust>=4)return "\n\n"+name+"也听过“"+record.title+"”的说法。她没有照着传闻打量你，只问里面是不是漏掉了真正重要的部分。";
 if(record.response==="embrace")return "\n\n"+name+"提起“"+record.title+"”时明显在忍笑。看起来，你后来添的那段细节也已经传到她这里。";
 return "\n\n"+name+"试探着提到了“"+record.title+"”。她还没有决定自己究竟相信多少。";
}
function rumorSummaryText(limit=3){
 normalizeSchoolLifeState();
 const heard=S.rumors.filter(record=>record.heard).slice(-limit);
 return heard.length?heard.map(record=>"“"+record.title+"”").join("、"):"还没有形成稳定说法";
}
