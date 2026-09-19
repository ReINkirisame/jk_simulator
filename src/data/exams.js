"use strict";

// 考试不再逐科模拟选择题。每场考试只选择总体策略；重要考试再追加一次临场抉择。
const EXAM_STRATEGIES={
 steady:{label:"稳妥拿分",check:1,score:5,desc:"先保证会做的题，减少偶然失误。"},
 risk:{label:"难题死磕",check:0,score:0,desc:"接受更大的成绩波动，争取把上限推高。"},
 preserve:{label:"保住状态",check:0,score:-4,desc:"不在一道题上耗尽精力，给之后的生活留余地。"}
};

const EXAM_BASE_SCORES={
 monthly:250,
 midterm:255,
 term1:260,
 opening:255,
 term2:260,
 "y2-term1":265,
 "y2-term2":270,
 "y3-monthly1":270,
 "y3-monthly2":275,
 graduation:280
};
