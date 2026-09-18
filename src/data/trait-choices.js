"use strict";

// 特质专属选项的数据层。
// 每组规则描述“什么特质能在什么场景替换哪个普通选项”。
// 以后增加别的特质时，优先在这里追加规则，不要在具体事件里散落 hasTrait 判断。
const HIDDEN_TRAITS={
 "古明地恋":{
   desc:"长期相处让大家更容易接住你的怪举动；仍有误会的可能，也仍会占用正常选项。"
 }
};

const TRAIT_CHOICE_SETS=[
 {
   id:"dianlao",
   trait:"癫佬",
   resolver:"chaosNpc",
   requiredTags:["npc","social"],
   offerChance:0.55,
   replaceRoles:["bold","social"],
   evolution:{trait:"古明地恋",xp:12,earliestIndex:16,minNpcs:4,minScenes:3},
   choices:[
     {
       id:"dian-broadcast",
       minLevel:1,
       label:"突然用广播腔播报她的一举一动",
       result:"你清了清嗓子，把眼前这段普通对话播成了校园午间特别节目。"
     },
     {
       id:"dian-final-battle",
       minLevel:1,
       label:"一本正经地宣布这里即将成为最终决战场",
       result:"你迅速划定交战区域，并郑重要求她选择自己的阵营。"
     },
     {
       id:"dian-rhyme",
       minLevel:1,
       label:"把刚才的话接成一段意义不明的押韵演说",
       result:"你越说越顺，最后甚至给这段临时演说补上了一个响亮的标题。"
     },
     {
       id:"dian-documentary",
       minLevel:2,
       label:"突然切换成纪录片旁白描述当前场面",
       result:"你压低声音，开始分析两名女高中生在走廊相遇时的迁徙规律。"
     },
     {
       id:"dian-legend",
       minLevel:2,
       label:"当场为她编造一则完整的校园传说",
       result:"不到一分钟，她已经成为这栋教学楼秘密历史里不可缺少的关键人物。"
     }
   ],
   evolvedChoices:[
     {
       id:"koishi-worldline",
       label:"理所当然地把这段对话改写成另一条世界线",
       result:"你从一个不存在的共同回忆讲起，而她竟然非常自然地把故事接了下去。"
     },
     {
       id:"koishi-sidequest",
       label:"拉着她去完成一件毫无来由却刚好有趣的事",
       result:"等你们完成那件小事，已经没人记得最开始为什么会突然出发。"
     },
     {
       id:"koishi-consensus",
       label:"用没人听懂却所有人都接受的方式结束争论",
       result:"你说出一句无法复述的结论。话题就这样圆满结束，仿佛本来就该如此。"
     },
     {
       id:"koishi-telepathy",
       label:"跳过前因后果，直接回答她还没问出口的问题",
       result:"你给出了答案。她点点头，然后才想起来把那个问题问完。"
     }
   ]
 }
];
