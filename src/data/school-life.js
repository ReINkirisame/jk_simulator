"use strict";

const HABIT_SLOT_ORDER=["study","afterschool","recovery"];
const HABIT_SLOTS={
 study:{label:"学习方式",help:"影响考试准备与学力成长。"},
 afterschool:{label:"放学以后",help:"决定项目、社团、人物或个人作品占据多少日常。"},
 recovery:{label:"恢复方式",help:"影响精力、压力与身体的长期续航。"}
};
const HABITS={
 study:{
  foundation:{label:"基础复盘",desc:"按月整理真正没弄懂的地方。成长平稳，考试分数更容易兑现。"},
  timed:{label:"限时训练",desc:"定期在时间压力下完成练习。更耗精力，稳定后改善考场判定。"},
  gaps:{label:"错因补缺",desc:"按错误原因回头补短板。能力较低时成长更快，见效需要时间。"}
 },
 afterschool:{
  project:{label:"项目优先",desc:"把固定的放学时间留给长期计划。项目判定更稳，也会挤占休息。"},
  club:{label:"固定社团",desc:"持续参加已经选择的社团。积累对应能力，也更容易留下社团传闻。"},
  people:{label:"固定见面",desc:"和一个具体的人保持联系。关系不再只由随机碰面决定。"},
  ownwork:{label:"个人作品",desc:"持续写、画或制作属于自己的东西。创造增长，独处时间也会变多。"}
 },
 recovery:{
  sleep:{label:"规律作息",desc:"守住相对稳定的睡眠。恢复可靠，不提供爆发式成长。"},
  exercise:{label:"固定运动",desc:"用少量运动维持体能和情绪。需要坚持才能形成优势。"},
  online:{label:"深夜上网",desc:"网络让你放松，也悄悄改变说话方式；精力会为此付出代价。"},
  quiet:{label:"给自己留白",desc:"刻意保留无安排的时间。压力下降得更快，但不直接提升能力。"}
 }
};

const FORUM_POST_TEMPLATES=[
 {id:"festival",title:()=>"[求助] 今年文化节到底有什么能玩的？",text:()=>"有人列了很长的愿望清单，下面已经开始争论场地和预算。"},
 {id:"exam",title:()=>"[经验] 月考以后先别急着对答案",text:()=>"帖子里有人总结复盘办法，也有人只回复了一张趴在桌上的表情。"},
 {id:"club",title:()=>"[树洞] 社团活动和作业撞在一起怎么办",text:()=>S.club&&S.club!=="归宅部"?"有人提到了"+S.club+"，但没有人替当事人决定该放弃哪边。":"回复从退社聊到时间表，最后又歪到了食堂。"},
 {id:"cat",title:()=>"[闲聊] 校门口那只猫到底叫什么",text:()=>"三个名字获得了差不多的支持，保安说它一个也不会理。"},
 {id:"project",when:()=>Boolean(S.project),title:()=>"[围观] 最近走廊里那个项目是谁在做",text:()=>S.project?"有人描述的很像"+S.project.name+"，细节却越传越不对。":"帖子很快沉了下去。"},
 {id:"class",title:()=>"[求问] 班长最近是不是又在忙什么",text:()=>"有人说她在整理材料，也有人说她只是忘了吃午饭。"},
 {id:"lunch",title:()=>"[投票] 食堂最不容易踩雷的窗口",text:()=>"投票结果每天都在变化，唯一共识是排队不能太长。"},
 {id:"old-item",when:()=>S.year>=3,title:()=>"[照片] 器材柜里翻出来的旧东西",text:()=>S.flags.keptLantern?"照片角落里有一盏修过的旧花灯。":"有人在辨认那是不是高一留下来的东西。"}
];

const RUMOR_DEFS=[
 {id:"home-club-chief",priority:5,
  when:()=>S.club==="归宅部"&&(choiceCount(c=>String(c.eventId).startsWith("holiday:")&&["rest","create"].includes(c.choiceId))>=3||habitTenure("afterschool")>=3&&S.habits.afterschool==="ownwork"),
  title:()=>"传说中的归宅部部长",
  summary:()=>"据说她不参加固定社团，却总能在放学后找到自己的事情。",
  npcLine:()=>"最近有人叫你“归宅部部长”。明明没有这个职务，说的人却很认真。",
  forum:()=>"[树洞] 归宅部是不是其实有个部长"},
 {id:"class-cpu",priority:7,
  when:()=>S.examArchive.filter(e=>e.score>=580).length>=3,
  title:()=>"班级CPU",
  summary:()=>"几次考试都稳定在前列以后，有人开始怀疑她是不是只在考场才会满负荷运行。",
  npcLine:()=>"有人说你是“班级CPU”。她说完又补了一句，至少你也会累。",
  forum:()=>"[讨论] 某人的脑子是不是只在考试时超频"},
 {id:"doujin-outsider",priority:9,
  when:()=>((S.project&&S.project.id==="archive"&&getRelation("同人女")>=5)||(S.flags["npcHelp:同人女"]||0)>=2&&(S.npcTrust["同人女"]||0)>=3),
  title:()=>"同人社编外人员",
  summary:()=>"她出现得太频繁，以至于已经没人记得她到底有没有正式加入。",
  npcLine:()=>"同人女那边有人问，你究竟算不算她们的编外人员。",
  forum:()=>"[求问] 为什么同人女旁边总有同一个人"},
 {id:"always-together",priority:8,
  when:()=>Boolean(S.habits.socialFocus)&&(S.flags.npcVisits&&S.flags.npcVisits[S.habits.socialFocus]||0)>=3&&getRelation(S.habits.socialFocus)>=5,
  title:()=>S.habits.socialFocus+"那边的人",
  summary:()=>"大家渐渐习惯在"+S.habits.socialFocus+"附近看见她。",
  npcLine:()=>"有人已经直接把你称作“"+S.habits.socialFocus+"那边的人”了。",
  forum:()=>"[树洞] 她们两个最近是不是总在一起"},
 {id:"project-survivor",priority:10,
  when:()=>Boolean(S.project&&S.project.result)&&((S.flags.projectSetbacks||0)>=1||S.project.result!=="完整交付"),
  title:()=>S.project&&S.project.result==="完整交付"?"把死项目救回来的人":"没有假装项目很顺利的人",
  summary:()=>S.project?S.project.name+"遇到过真正的问题，而她把能完成的部分留了下来。":"她从一个项目里活着回来了。",
  npcLine:()=>"项目结束以后，有人开始用一个很夸张的称呼说起你们那段经历。",
  forum:()=>"[复盘] 那个差点做不完的项目后来怎么样了"},
 {id:"poster-face",priority:6,
  when:()=>Boolean(S.flags.photoNoticed&&S.flags.posterFace),
  title:()=>"海报上那个女生",
  summary:()=>"两次被镜头记住以后，陌生人也开始觉得她看起来眼熟。",
  npcLine:()=>"有人认出了海报上的你，但把项目内容说错了一大半。",
  forum:()=>"[求问] 活动海报上的人是哪个班的"},
 {id:"club-constant",priority:5,
  when:()=>S.club&&S.club!=="归宅部"&&S.habits.afterschool==="club"&&habitTenure("afterschool")>=4,
  title:()=>S.club+"常驻人口",
  summary:()=>"只要活动室还亮着灯，好像就总能在那里找到她。",
  npcLine:()=>"学妹问你是不是住在"+S.club+"活动室里。听语气，她似乎真有一点相信。",
  forum:()=>"[求证] "+S.club+"是不是有个常驻人口"},
 {id:"midnight-radio",priority:11,
  when:()=>S.club==="广播站"&&S.habits.recovery==="online"&&habitTenure("recovery")>=2&&S.resources.stress>=30,
  title:()=>"深夜广播的听众",
  summary:()=>"广播室没有人在值班时，仍有人说自己听见了一段像是说给她的话。",
  npcLine:()=>"有人问你，昨晚广播室那段声音是不是在叫你的名字。",
  forum:()=>"[求助] 昨晚九点四十七分广播室真的没人吗"},
 {id:"internet-native",priority:4,
  when:()=>Number(S.tendencies["网络化"])>=4,
  title:()=>"互联网原住民",
  summary:()=>"她说的话有时需要等半秒，大家才能判断那究竟是不是正常中文。",
  npcLine:()=>"班里有人开始整理你的常用语，试图做一份并不可靠的翻译表。",
  forum:()=>"[整理] 某位同学的用语翻译表"},
 {id:"corridor-anomaly",priority:12,
  when:()=>getTraitXp("癫佬")>=8,
  title:()=>"走廊决斗场常驻选手",
  summary:()=>"她已经用直尺发起过太多次决斗，大家开始默认走廊地砖就是交战区域。",
  npcLine:()=>"新生问走廊里为什么有人递出两把直尺。旁边的人回答：“她在选武器，别踩到场地线。”",
  forum:()=>"[新人求助] 用直尺决斗是本校传统吗"},
 {id:"confidant",priority:6,
  when:()=>trustedNpcCount(3)>=3,
  title:()=>"关系中转站",
  summary:()=>"不知从什么时候起，几个人都愿意把没整理好的事情先告诉她。",
  npcLine:()=>"有人说，想打听一件事可以先来问你。其实她们找你的原因并不完全一样。",
  forum:()=>"[树洞] 为什么好几个人都会先去找她"},
 {id:"lantern-keeper",priority:10,
  when:()=>S.year>=3&&Boolean(S.flags.keptLantern),
  title:()=>"旧花灯的保管人",
  summary:()=>"那盏高一留下的灯被修好以后，已经没人说得清它为什么一直没有被丢掉。",
  npcLine:()=>"有人看见你修好的旧花灯，说它好像每年都会自己回到器材柜。",
  forum:()=>"[照片] 那盏旧花灯是不是又出现了"}
];
