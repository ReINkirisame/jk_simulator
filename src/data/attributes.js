"use strict";

const ATTRIBUTE_RULES={budget:40,initialMax:20,growthMax:30,xpPerLevel:4,semesterGrowthCap:3,appearanceDrift:2};
const ATTRIBUTES={
 academic:{label:"学力",input:"iAcademic",help:"理解、考试与竞赛；通过学习逐步成长。"},
 expression:{label:"表达",input:"iExpression",help:"演讲、协商和主动交流；不代替外貌或信任。"},
 fitness:{label:"体能",input:"iFitness",help:"运动、恢复和持续行动；不等于当前精力。"},
 creativity:{label:"创造",input:"iCreativity",help:"绘画、写作、音乐和策划；不再借用表达判定。"},
 appearance:{label:"外貌",input:"iAppearance",help:"第一印象、出镜和选角；通常只在初始值附近变化。"}
};
const FAMILY_BACKGROUNDS={
 modest:{label:"拮据",allowance:60,help:"每月零花钱60；付费活动需要攒钱，校内替代方案始终开放。"},
 ordinary:{label:"普通",allowance:120,help:"每月零花钱120；通常需要在材料、出游和辅导之间取舍。"},
 comfortable:{label:"宽裕",allowance:200,help:"每月零花钱200；更容易承担兴趣和活动开销。"},
 wealthy:{label:"富裕",allowance:320,help:"每月零花钱320；资源更多，但金钱不会直接换来信任或能力。"}
};

// 一个条目对应一个月。假期也是真实月份，不跳过成长计数或生日。
const CALENDAR=[];
for(let year=1;year<=3;year+=1){
 for(const month of [9,10,11,12,1,2,3,4,5,6,7,8]){
  if(year===3&&month===7)break;
  const grade=["","高一","高二","高三"][year];
  const holiday=[1,2,8].includes(month);
  const term=month===1||month===2?grade+"寒假":month===8?grade+"暑假":grade+(month>=9?"上":"下");
  CALENDAR.push({year,month,term,holiday,stage:year===1?"探索":year===2?"坚持":"取舍"});
 }
}
