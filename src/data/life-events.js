"use strict";

const FX={
 xp:(key,value)=>({type:"xp",key,value}),
 resource:(key,value)=>({type:"resource",key,value}),
 flag:(key,value)=>({type:"flag",key,value}),
 trust:(npc,value)=>({type:"trust",npc,value}),
 relation:(npc,value)=>({type:"relation",npc,value}),
 project:value=>({type:"project",value})
};

// 保留旧叙事，补足只有不同台词、没有不同结果的固定选项。
const LEGACY_FIXED_EFFECTS={
 "初雪":[[FX.xp("fitness",1),FX.resource("energy",-4)],[FX.resource("energy",3)]],
 "单身情歌":[[FX.resource("energy",-3),FX.flag("joinedChorus",true)],[FX.flag("heardChorus",true)]],
 "才俊杯":[[FX.flag("soloStage",true)],[FX.trust("主人公",1),FX.flag("groupStage",true)]],
 "扫雪":[[FX.xp("fitness",2),FX.resource("energy",-7)],[FX.xp("academic",1),FX.resource("energy",-3),FX.flag("noticedSafety",true)]],
 "花灯在走廊展示":[[FX.xp("expression",1),FX.flag("lanternProud",true)],[FX.xp("creativity",2),FX.flag("lanternCompared",true)]],
 "班级新年联欢会":[[FX.flag("newYearStage",true)],[FX.resource("stress",-3)]],
 "跨年":[[FX.resource("energy",6),FX.resource("stress",-4)],[FX.trust("班长",1),FX.resource("energy",-3)]],
 "期末复习":[[FX.flag("revisionMethod","计划")],[FX.flag("revisionMethod","补弱"),FX.resource("energy",-3),FX.xp("academic",1)]],
 "语文课话剧排练演出":[[FX.flag("rehearsedDrama",true),FX.xp("creativity",1)],[FX.flag("improvisedDrama",true),FX.resource("stress",2)]],
 "周日去南湖公园的游乐园玩":[[FX.xp("fitness",1),FX.resource("energy",-10),FX.resource("stress",-6)],[FX.resource("energy",6),FX.trust("主人公",1)]],
 "文化节":[[FX.xp("expression",2),FX.resource("energy",-8),FX.flag("festivalWork",true)],[FX.xp("creativity",1),FX.resource("stress",-4),FX.flag("festivalObserved",true)]],
 "社团活动周":[[],[FX.xp("creativity",1),FX.resource("stress",-3),FX.flag("otherClubsSeen",true)]],
 "年级篮球比赛":[[FX.xp("fitness",2),FX.resource("energy",-8),FX.relation("体育生",1)],[FX.xp("expression",1),FX.trust("体育生",1),FX.resource("energy",-2)]],
 "科技节":[[FX.xp("academic",2),FX.xp("creativity",1),FX.resource("energy",-8),FX.flag("sciencePractice",true)],[FX.xp("academic",1),FX.resource("stress",-2),FX.flag("scienceObserved",true)]],
 "学长学姐高考":[[FX.trust("学姐",1),FX.flag("sawSeniorOff",true)],[FX.resource("stress",2),FX.flag("examObserver",true)]],
 "一日职业体验":[[FX.xp("expression",2),FX.resource("energy",-5),FX.flag("careerApproach","参与")],[FX.xp("academic",1),FX.resource("stress",-2),FX.flag("careerApproach","观察")]]
};

const NPC_ARCS={
 "班长":{skill:"academic",goals:["想把所有人的名字记住。","想完成一份不是成绩表的班级档案。","正在学习不替每个人做决定。"],
  scenes:[
   ["没有写进自我介绍的事","班长把值日表放到一边，问你有没有一直想做、却不好写在自我介绍里的事。她自己的答案是一册班级手记。","帮她整理最初的名单","她把空白页留给你。你们发现，给一个人留下位置，比填满一张表格麻烦得多。"],
   ["档案里不只有优秀事迹","班长想把比赛输了、临时逃了排练的人也写进档案。有同学觉得这些事不够好看，她拿不定主意。","一起核对记录，而不是替别人删掉","你们把事实和评价分开写。最后她决定先征求当事人的同意。"],
   ["这张表不必填满","班长的毕业册还空着几格。以前她会追着每个人补齐，现在却问你，空白是不是也能保留。","帮她把最后的校对做完","你没有替没回复的人编一句留言。她把那几页留白，第一次按时合上了册子。"]]},
 "同人女":{skill:"creativity",goals:["把画本藏得很严，又希望有人认真看。","想做第一本没有借用别人角色的小册子。","正在决定要不要继续画自己的故事。"],
  scenes:[
   ["不是随手涂鸦","她给你看了画本的一角，先声明这只是草稿。你注意到，同一个走廊她已经画了好几次。","和她一起修改一格分镜","你们挪动了一个对白框，整页的节奏忽然变了。她认真记下你提出的办法。"],
   ["这次没有现成的人设","她终于画了几个完全属于自己的角色，却觉得每一个都差一点意思。旧作品的关注数仍在增长，新稿只有你看过。","陪她试一个原创短篇的开头","你没有说这一定会比旧作品受欢迎。你们先把第一页画出来，再讨论第二页。"],
   ["最后一页先不画","她的故事还没有结尾，高考后的地址也没有确定。画本放在你面前，书脊已经磨白。","一起整理那些没有画完的草稿","你们把废稿也编号存了下来。这段经历不是因为完成了才值得留下。"]]},
 "体育生":{skill:"fitness",goals:["训练之外，也想有人陪她慢慢走。","在训练与文化课之间重新安排时间。","想跑完最后一场校内比赛，不只记住名次。"],
  scenes:[
   ["多绕一圈的路","训练结束后，她故意从远一点的校门出去。她说这是放松，其实只是还不想立刻面对今晚的作业。","陪她做完放松，再慢慢走回去","你们没有再比谁快。走到校门口的时候，她把明天的安排说给你听。"],
   ["少练半小时会怎样","她把新的课表给你看。每个格子都有事情，却没有吃晚饭的位置。她说只要跑快一点就能赶上。","帮她试一个留出休息的新节奏","你陪她提前结束了一次训练。那半小时没有让一切崩塌，却让她终于坐下吃完一顿饭。"],
   ["终点以后还有路","最后一次训练结束，她没有像往常那样马上收东西，反而把计时器放在了看台上。","陪她跑完不计时的最后一圈","你们一路跑得很慢。冲过终点线时，她没有低头看数字。"]]},
 "中二病":{skill:"creativity",goals:["正在给普通校园编一本秘密地图。","想把地图做成一次真正能玩的寻宝活动。","嘴上说结界永存，正在偷偷画告别路线。"],
  scenes:[
   ["结界的维修通知","她严肃地通知你，教学楼的结界已经松动。你看了一眼窗外，原来是走廊的风把公告吹掉了。","陪她补一张地图上的标记","你们把路标贴回原处。她承认刚才忘了带胶带，话题终于落到实际物资上。"],
   ["冒险需要有人愿意参加","她准备了很长的世界观，第一位试玩者却卡在了门口。她抱着地图，一时说不出下一句介绍。","陪她测试一个能真正走通的谜题","你把看不懂的地方直接指出来。她先嘴硬了一会儿，最后还是拿笔改了。"],
   ["结界边缘的告别","她给你一张新地图，上面的地点全是你们去过的地方。最后一格没有画门，只写着“毕业以后也可通行”。","和她走完地图最后的一段","你们没有找到隐藏宝箱，只在便利店买了饮料。她说补给点本来就是地图的一部分。"]]},
 "主人公":{skill:"expression",goals:["什么都想参加。","开始学着承认自己也会忙不过来。","想把真正舍不得的约定保留下来。"],scenes:[
  ["放学后的四个计划","她一口气报了四个活动，最后才想起今天只剩一小时。","帮她把一个活动认真做完","你们没有跑遍所有场地，倒是真的和一群人待到了活动结束。"],
  ["第一次说下次吧","她拿着三张报名表，突然问你拒绝别人会不会很扫兴。","陪她说明一项做不到的承诺","收到回复后，她发现对方并没有像想象中那样失望。"],
  ["毕业后的第一张日程表","她的暑假计划不再写得密密麻麻，唯独和你们见面的时间画了圈。","把一项能做到的约定写下来","你们没有答应永远每天见面，只定下下一次具体的日期。"]]},
 "大小姐":{skill:"expression",goals:["希望朋友不是因为她总请客才留下。","正在学着直接说出自己的喜好。","想带走几段与价格无关的记忆。"],scenes:[
  ["她推荐的那家店","她介绍了几家很贵的店，又很小声地提到巷口的馄饨。","认真问她自己最喜欢哪一家","她没有再比较价格，带你去了那家只有几张桌子的小店。"],
  ["不是一句随便","大家又在等她决定聚会地点。她看了你一眼，说这次其实想去公园。","帮她把真正的想法说清楚","计划最后没有最昂贵的那一项，她却比平时更愿意讨论。"],
  ["不用包装纸的礼物","她整理出一个装着旧票根的小盒子，嫌弃纸边都卷起来了，却一张也没扔。","陪她把旧票根整理好","票根上的金额已经看不清，背后写的日期却还在。"]]},
 "转校生":{skill:"creativity",goals:["想找到一条不用解释过去的放学路。","开始愿意带人去自己熟悉的地方。","想留下一个主动写出的联系方式。"],scenes:[
  ["走哪条路都可以","她没说从前的学校，只问你明天会不会也从这里走。","一起找一条新的放学路","你们没一直说话。临别时，她主动指出了明天可以等人的位置。"],
  ["这次由她带路","她说知道一条河边的小路，问你有没有空。说完以后又补了一句，不去也没关系。","陪她记录沿路的一点东西","你们拍了桥下的光，没有拍对方的脸。她挑了一张留作聊天背景。"],
  ["这次不是突然消失","她提前告诉你毕业后的去向，在纸上写下不常用但一直保留的联系方式。","认真回写自己的联系方式","你们都没有要求对方保证永远不变。纸被折好，放进了笔袋。"]]},
 "学姐":{skill:"academic",goals:["准备毕业，也想把熟悉的校园交给学妹。","在新环境里重新适应普通的一天。","偶尔回校，已经不再替你指每一条路。"],scenes:[
  ["她推荐的安静地方","学姐带你走到楼后，说自己刚入学时也在这里迷过路。","帮她整理留给学妹的小建议","你把看不懂的校内简称一一问清楚。她笑着删掉了好几句自以为人人都懂的话。"],
  ["隔着屏幕的新学校","她发来一张大学食堂的照片，抱怨找教室居然还会迷路。","一起把各自的新生活说清楚","原来离开高中也不等于什么都会。你们各自承认了最近的一点笨拙。"],
  ["这次轮到你带路","她回校时发现走廊展板换了，站在门口等你介绍。","把这三年真正重要的地方指给她","你没有照着她当年的路线走。她听完以后，说这回轮到你给学妹写建议了。"]]}
};

const PROJECTS={
 archive:{name:"校园留声册",skill:"creativity",partner:"同人女",description:"把声音、旧照片和原创短篇装进一本能翻阅的校园小册子。"},
 science:{name:"校园问题研究",skill:"academic",partner:"班长",description:"调查一件真实的校园小问题，把记录做成可以复查的提案。"},
 sport:{name:"放学后运动会",skill:"fitness",partner:"体育生",description:"办一场不只面向校队、普通同学也愿意参加的运动活动。"}
};

const PHOTO_EVENT={id:"first-class-photo",tag:"特殊场合 · 外貌与创造",title:"班级的第一张照片",
 text:"摄影同学正在安排站位。有人希望站在前排，有人更愿意帮忙构图。被镜头注意和让人信任，是两回事。",
 choices:[
  {id:"front",label:"自然地站到镜头前 · 外貌判定",check:{stat:"appearance",difficulty:7},effects:[FX.resource("energy",-2)],outcomes:{
   success:{text:"摄影同学记住了你，说以后活动海报需要人时会来问问。机会留了下来，但同学并没有因此更信任你。",effects:[FX.flag("photoNoticed",true)]},
   failure:{text:"摄影同学把更多注意力放在了整体队形。你留在照片里，没有获得额外邀约，也没有失去之后主动报名的机会。",effects:[FX.flag("photoNoticed",false)]}}},
  {id:"groom",label:"整理仪容后再出镜 · 外貌判定+1",cost:20,effects:[FX.flag("grooming",1),FX.resource("energy",-4)],run:()=>{S.flags.groomingMonth=monthKey();},check:{stat:"appearance",difficulty:7},outcomes:{
   success:{text:"发夹和衣领让镜头里的你显得精神了一点。摄影同学记下了你的名字；这次修正只在当月有效。",effects:[FX.flag("photoNoticed",true)]},
   failure:{text:"你把自己收拾得舒服些，但这次没有成为照片的中心。打扮不会永久改变基础外貌。",effects:[FX.flag("photoNoticed",false)]}}},
  {id:"frame",label:"帮忙调整画面 · 创造判定",effects:[FX.xp("creativity",1)],check:{stat:"creativity",difficulty:7},outcomes:{
   success:{text:"你换了几个站位，终于让后排的人也完整进入画面。摄影同学想起之后还需要一位海报助手。",effects:[FX.flag("designNoticed",true)]},
   failure:{text:"第一版构图并不好用。你跟着摄影同学重新排了一遍，至少看清楚了为什么要改。",effects:[FX.xp("creativity",1)]}}},
  {id:"quiet",label:"站到熟悉的人身边",protected:true,text:"你们小声交换了一句吐槽。照片洗出来时，你记得的是身旁那个人。",effects:[FX.resource("stress",-3)],run:()=>{if(S.npcs[0])changeRelation(S.npcs[0],1,"一起拍照");}}
 ]};

const Y2_EVENTS={
 10:{id:"y2-plan",title:"项目不是报名表",text:()=>"你们决定做【"+S.project.name+"】。第一张任务单很长，真正能用的只有每周几个放学后的小时。",choices:[
  {id:"core",label:"先完成一个最小样品 · 专业判定",run:()=>workOnProject("core"),impact:"先试做一个能运行的样品"},
  {id:"roles",label:"先把分工谈清楚 · 表达判定",run:()=>workOnProject("roles"),impact:"先商量分工与能做到的承诺"},
  {id:"small",label:"主动缩小规模",text:"你删掉了一些好看的设想。项目少了气势，却第一次有了能完成的边界。",effects:[FX.project(1),FX.resource("stress",-5),FX.flag("projectSmall",true)]}
 ]},
 11:{id:"y2-poster",title:"谁站在海报上",text:()=>S.flags.photoNoticed?"高一拍照时记住你的人真的找来了。这次项目需要一张海报，出镜与制作都有人可以做。":"项目需要一张海报。没有人预先钦定主角，愿意出镜或制作的人都能报名。",choices:[
  {id:"model",label:"试着出镜 · 外貌判定",effects:[FX.resource("energy",-5)],check:{stat:"appearance",difficulty:8,modifiers:()=>[{label:"之前的出镜印象",value:S.flags.photoNoticed?1:0}]},outcomes:{
   success:{text:"海报吸引了一些注意。随之而来的还有打听和不请自来的评价；被看见不等于项目已经做好。",effects:[FX.project(1),FX.resource("stress",5),FX.flag("posterFace",true)]},
   failure:{text:"试拍没有达到想要的效果。你们换成物件与手部的照片，海报照常完成，下一阶段仍然能参加。",effects:[FX.xp("creativity",1),FX.flag("posterObjects",true)]}}},
  {id:"design",label:"负责海报设计 · 创造判定",effects:[FX.xp("creativity",2),FX.resource("energy",-6)],check:{stat:"creativity",difficulty:8,modifiers:()=>[{label:"高一的构图经验",value:S.flags.designNoticed||S.flags.lanternCompared?1:0}]},outcomes:{
   success:{text:"你把文字和图片重新排好。海报没有明星，却让路过的人能一眼看懂你们在做什么。",effects:[FX.project(2)]},
   failure:{text:"你们临时采用了学校提供的基础模板。版面并不出众，但信息总算没有缺。",effects:[FX.project(1),FX.flag("posterRetry",true)]}}},
  {id:"contact",label:"逐个去解释活动，而不是依赖海报",effects:[FX.xp("expression",2),FX.resource("energy",-8),FX.project(1)],text:"你去了几间教室。不是每个人都愿意停下来听，但愿意来的人已经知道该去哪里。"}
 ]},
 12:{id:"y2-prototype",title:"第一次给别人看",text:()=>"目前积累了"+S.project.progress+"份项目进展。有人建议再润色一周，也有人提醒，拖到放假可能就没有人来试了。",choices:[
  {id:"test",label:"先让同学测试未完成的版本",run:()=>workOnProject("test"),effects:[FX.flag("testedPrototype",true)],impact:"愿意让别人指出半成品的问题"},
  {id:"polish",label:"把最在意的部分再磨一遍",run:()=>workOnProject("polish"),effects:[FX.flag("testedPrototype",false)],impact:"先打磨作品，留下了尚未测试的部分"}
 ]},
 3:{id:"y2-repair",title:"假期没有替你解决问题",text:()=>S.flags.testedPrototype?"寒假收来的意见有整整一页。最难受的几条，偏偏说得最具体。":"漂亮的版本终于公开测试，问题却出在最基本的入口上。此前推迟的测试，现在必须补回来。",choices:[
  {id:"repair",label:"承认问题，重新拆开做 · 专业判定",run:()=>workOnProject("repair"),effects:[FX.flag("projectRepaired",true)]},
  {id:"reduce",label:"删掉有问题的部分，保住核心",text:"你们没有把所有问题一次解决，而是划出了这次真正要交的范围。没做完的部分被诚实写在说明里。",effects:[FX.project(1),FX.resource("stress",-6),FX.flag("projectRepaired",true),FX.flag("projectSmall",true)],run:()=>{changeTrust(S.project.partner,1,"没有隐瞒问题");}}
 ]},
 4:{id:"y2-budget",title:"愿望需要一份预算",text:()=>"打印、耗材或器材租用一共需要180元。你的零花钱还剩"+S.resources.cash+"元。学校也能提供旧设备，不过要花时间清点和调试。",choices:[
  {id:"buy",label:"购买合用的材料",cost:180,text:"你们按清单买齐了东西。省下的调试时间是真的，但完成它仍需要亲自动手。",effects:[FX.project(2),FX.resource("energy",-3),FX.flag("projectSupply","自购")]},
  {id:"borrow",label:"借用学校旧设备 · 免费",text:"借来的东西不完全趁手，你们多花了一个下午把它们调到能用。",effects:[FX.project(2),FX.resource("energy",-12),FX.xp("academic",1),FX.flag("projectSupply","借用")]},
  {id:"reuse",label:"重新设计，减少材料需求 · 创造判定",effects:[FX.xp("creativity",2),FX.resource("energy",-6)],check:{stat:"creativity",difficulty:8},outcomes:{success:{text:"改动让成品朴素了些，却保留了最重要的功能。",effects:[FX.project(2),FX.flag("projectSupply","改造")]},failure:{text:"方案没能完全替代材料。你们先交一个缩小版本，留下了下一次补做的清单。",effects:[FX.project(1),FX.flag("projectSmall",true),FX.flag("projectSupply","缩减")]}}}
 ]},
 5:{id:"y2-show",title:"终于到了展示的这一天",text:()=>S.project.name+"已经积累"+S.project.progress+"份进展。"+(S.flags.posterFace?"海报让更多人来问你是什么项目。":"来到现场的人不算多，但有人认真站到了你们的展位前。")+(S.flags.lanternStyle==="creative"?"你想起高一那盏不太对称的花灯：这次也不必把所有东西做得和示范图一样。":"你逐项核对布置，像高一固定花灯骨架时一样。"),choices:[
  {id:"speak",label:"由我来讲解 · 表达判定",run:()=>presentProject("expression")},
  {id:"demo",label:"把作品交给大家体验 · 专业判定",run:()=>presentProject(S.project.skill)},
  {id:"quiet",label:"先做小范围交流，不勉强公开表演",text:"你们只留下几位愿意认真体验的人。掌声少了一些，收到的意见反而足够写满一页。",effects:[FX.project(1),FX.resource("stress",-5),FX.flag("projectPresented","小范围交流")]}
 ]},
 6:{id:"y2-handover",title:"结束以后，谁来收拾",text:"活动结束了，剩下的器材、文件和联系人还堆在一起。没有人会为收尾再鼓一次掌。",choices:[
  {id:"finish",label:"把借来的东西和记录交还好",text:"你们对着清单一项项核对。下次借东西时，负责人已经知道你们会认真归还。",effects:[FX.project(2),FX.resource("energy",-6),FX.flag("projectHandover",true)],run:()=>{changeTrust(S.project.partner,2,"一起完成收尾");}},
  {id:"share",label:"和伙伴分担，约好补交日期",text:"你没有一个人包办，也没有直接消失。你们把剩余任务分成两份，写明了最后的日期。",effects:[FX.project(1),FX.xp("expression",1),FX.resource("energy",-3),FX.flag("projectHandover",true)],run:()=>{changeTrust(S.project.partner,1,"把边界说清楚");}}
 ]},
 7:{id:"y2-wrap",title:"把项目写进学年末",text:"暑假前，老师让你们留下最终版本。最初报名表上的几句话，已经变成了好几个月的实际生活。",choices:[
  {id:"archive",label:"把成功与失误都归档",run:()=>completeProject(false)},
  {id:"revision",label:"再做一次有限的修订，然后交出去",effects:[FX.resource("energy",-8)],run:()=>completeProject(true)}
 ]}
};

const Y3_EVENTS={
 9:{id:"y3-priority",title:"课表上没有多出来的时间",text:()=>"高三的课表贴好了。你已经形成了这样的日常：\n"+habitSummaryText()+"\n\n其中两项会成为这一年的底层，只留一个位置在寒假允许微调。现在要决定，最后一年主要保护哪一块生活。",choices:[
  {id:"study",label:"把主要余力交给学业 · 学习方式仍可微调",text:"课余练习会更多一些。放学安排和恢复方式继续沿用高二的节奏。",run:()=>lockSeniorHabits("study"),impact:"高三优先学业，只给学习方式留下调整余地"},
  {id:"create",label:"每个月都留一点创作时间 · 放学安排仍可微调",text:"你没有把画本和稿纸全部收走。学习和恢复方式不再频繁更换。",run:()=>lockSeniorHabits("create"),impact:"高三继续创作，只给放学安排留下调整余地"},
  {id:"body",label:"先守住身体状态 · 恢复方式仍可微调",text:"你决定不把每一小时都变成硬撑。学习与放学后的基本节奏固定下来。",run:()=>lockSeniorHabits("body"),impact:"高三优先维持状态，只给恢复方式留下调整余地"},
  {id:"people",label:"给重要的人保留时间 · 放学安排仍可微调",text:"你们约定不必随时回复，但会留下一段真正说话的时间。",run:()=>lockSeniorHabits("people"),impact:"高三保留重要关系，只给放学安排留下调整余地"}
 ]},
 10:{id:"y3-callback",title:"高一留下的那盏灯",text:()=>S.flags.lanternStyle==="creative"?"旧器材柜清出来一盏形状特别的花灯。有人问是不是放错了，你一眼就认出了那个不对称的轮廓。":"器材柜里清出一盏旧花灯。骨架还撑得住，只是纸边已经褪色。",choices:[
  {id:"repair",label:"花一个午休把它修好",effects:[FX.xp("creativity",2),FX.resource("energy",-5),FX.flag("keptLantern",true)],text:"灯没有重新变成崭新的样子。你保留了旧颜色，把松掉的地方重新粘好。",impact:"高三修好了高一做的花灯"},
  {id:"picture",label:"拍张照片，允许它在这里结束",effects:[FX.resource("stress",-5),FX.flag("keptLantern",false)],text:"你把照片发给那时一起做手工的人。你们没有再做一盏，却还记得那个下午。",run:()=>{if(S.npcs[0])changeTrust(S.npcs[0],1,"分享旧记忆");}}
 ]},
 11:{id:"y3-mock1",title:"第一次模拟考试前",text:"试卷没有问你这几年有没有认真生活。它只会考眼前的内容，但你带进考场的并不只有这一周的复习。",choices:[
  {id:"steady",label:"稳妥完成一次模拟",run:action=>startExam("高三第一次模拟","y3-monthly1","steady",action.next)},
  {id:"risk",label:"用这次模拟试一试难题上限",run:action=>startExam("高三第一次模拟","y3-monthly1","risk",action.next)},
  {id:"preserve",label:"保住状态，不把模拟当终点",run:action=>startExam("高三第一次模拟","y3-monthly1","preserve",action.next)}
 ]},
 12:{id:"y3-old-project",title:"学弟学妹来问旧项目",text:()=>S.project?"有人想接着做【"+S.project.name+"】。她们翻到你们的记录，问到的第一个问题，正好是你们曾经出错的地方。":"学弟学妹来问高二活动的安排。你发现自己已经是能给别人建议的人了。",choices:[
  {id:"teach",label:"留一次时间，讲清楚当年的坑",effects:[FX.xp("expression",2),FX.resource("energy",-7),FX.flag("projectPassedOn",true)],text:"你没有说自己当年什么都会。她们反而因为你讲清楚了失败的地方，知道下一步该从哪里开始。",impact:"把项目经验交给下一届"},
  {id:"send",label:"把记录交出去，说明自己没有更多时间",effects:[FX.resource("stress",-4),FX.flag("projectPassedOn",true)],text:"你把文件整理好，写明哪些内容可以复用。交出去以后，你终于不用再替它负责到底。"}
 ]},
 3:{id:"y3-plan-again",title:"最后三个月的安排",text:()=>"距离毕业只剩几个月。当前精力"+S.resources.energy+"、压力"+S.resources.stress+"。寒假已经调整过仍有余地的部分，现在只做一次短期修正，不重新搭一套生活。",choices:[
  {id:"focus",label:"集中补一个具体短板",text:"你删掉大而空的计划，只留下能检查进度的一项。",effects:[FX.xp("academic",2),FX.resource("energy",-7)]},
  {id:"recover",label:"把恢复状态正式写进计划",text:"休息不再是做完所有事情之后才可能得到的奖励。",effects:[FX.resource("energy",12),FX.resource("stress",-10)]},
  {id:"keep",label:"保留现有节奏，削减不必要的活动",text:"你没有把已经坚持的东西全部推倒，只承认有些事这次做不到。",effects:[FX.resource("energy",6),FX.resource("stress",-5)]}
 ]},
 4:{id:"y3-mock2",title:"又一张成绩单之前",text:"离正式考试更近了。桌角的错题本翻得起了毛边，隔壁的人还在默背。预备铃响起，你把最后一页合上。",choices:[
  {id:"steady",label:"兑现已经做过的准备",run:action=>startExam("高三第二次模拟","y3-monthly2","steady",action.next)},
  {id:"risk",label:"仍然尝试那些有希望的难题",run:action=>startExam("高三第二次模拟","y3-monthly2","risk",action.next)},
  {id:"preserve",label:"不为了这一次耗尽自己",run:action=>startExam("高三第二次模拟","y3-monthly2","preserve",action.next)}
 ]},
 5:{id:"y3-last-picture",title:"最后一次班级合照",text:()=>S.flags.photoNoticed?"摄影同学还记得你高一时站过的位置。这次却没有人能保证以后还站在一起。":"摄影同学在操场上架好相机。你已经不用四处找，便知道想站在谁旁边。",choices:[
  {id:"front",label:"帮忙招呼大家站好 · 表达判定",effects:[FX.xp("expression",1),FX.resource("energy",-4)],check:{stat:"expression",difficulty:7},outcomes:{success:{text:"散乱的人群慢慢站好。你这次被记住，不是因为长什么样，而是因为大家听见了你。",effects:[FX.flag("graduationPhoto","组织者")]},failure:{text:"你喊了几声，最后还是班长帮忙维持了秩序。照片照常拍下，你也没有被留在画面外。",effects:[FX.flag("graduationPhoto","尝试组织")]}}},
  {id:"near",label:"安静地站在想念的人身旁",text:"快门按下去以前，有人碰了碰你的袖子。你没有转头，只往那边站近了一点。",effects:[FX.resource("stress",-6),FX.flag("graduationPhoto","朋友身边")],run:()=>{const name=closestNpc();if(name)changeTrust(name,1,"最后一次合照");}}
 ]},
 6:{id:"y3-final",title:"六月，走进考场",text:"前面的选择不会消失，也不会全部压缩成这一张成绩单。但今天，你仍然要带着自己的准备走进去。",choices:[
  {id:"steady",label:"按熟悉的节奏完成",run:action=>startExam("毕业升学考试","graduation","steady",action.next)},
  {id:"risk",label:"在保住基础后挑战上限",run:action=>startExam("毕业升学考试","graduation","risk",action.next)},
  {id:"preserve",label:"稳定身心，完成自己会做的部分",run:action=>startExam("毕业升学考试","graduation","preserve",action.next)}
 ]}
};
