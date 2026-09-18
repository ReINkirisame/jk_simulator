"use strict";

// 考试不再逐科模拟选择题。每场考试只选择总体策略；重要考试再追加一次临场抉择。
const EXAM_STRATEGIES={
 steady:{label:"稳妥拿分",check:1,score:5,desc:"先保证会做的题，减少偶然失误。"},
 risk:{label:"难题死磕",check:0,score:0,desc:"接受更大的成绩波动，争取把上限推高。"},
 preserve:{label:"保住状态",check:0,score:-4,desc:"不在一道题上耗尽精力，给之后的生活留余地。"}
};

const EXAM_BASE_SCORES={
 monthly:470,
 midterm:480,
 term1:485,
 opening:475,
 term2:500
};
