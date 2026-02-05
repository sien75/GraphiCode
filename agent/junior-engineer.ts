import JUNIOR_ENGINEER_SKILL_TS_A from "skills/junior-engineer-ts-a.md" with { type: "text" };
import JUNIOR_ENGINEER_SKILL_TS_S from "skills/junior-engineer-ts-s.md" with { type: "text" };

// Algorithm tools
import { readAlgorithmReadmeByIdTool } from "../tools/algorithm/read-algorithm-readme-by-id";
import { writeAlgorithmCodeByIdTool } from "../tools/algorithm/write-algorithm-code-by-id";

// State tools
import { readStateReadmeByIdTool } from "../tools/state/read-state-readme-by-id";
import { writeStateCodeByIdTool } from "../tools/state/write-state-code-by-id";

// Type tools
import { readTypeByIdTool } from "../tools/type/read-type-by-id";

/* Algorithm Junior Engineer */

export const juniorEngineerTools_ts_a = [
  readAlgorithmReadmeByIdTool,
  readTypeByIdTool,
  writeAlgorithmCodeByIdTool,
];

export const juniorEngineerModelName_ts_a = "x-ai/grok-code-fast-1";

export const juniorEngineerSkill_ts_a = JUNIOR_ENGINEER_SKILL_TS_A;

/* State Junior Engineer */

export const juniorEngineerTools_ts_s = [
  readStateReadmeByIdTool,
  readTypeByIdTool,
  writeStateCodeByIdTool,
];

export const juniorEngineerModelName_ts_s = "x-ai/grok-code-fast-1";

export const juniorEngineerSkill_ts_s = JUNIOR_ENGINEER_SKILL_TS_S;
