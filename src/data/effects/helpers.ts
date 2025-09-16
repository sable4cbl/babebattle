import type { EffectScript } from "../../types/effects";
import { uid } from "../../utils/uid";

export function stubEffect(group: EffectScript["group"], name: string, gifName: string): EffectScript {
  return {
    id: uid(),
    name,
    group,
    target: { kind: "none" },
    description: "",
    // Make stubs ineligible by capping effect limit to 0
    limits: [{ capEffectLimitTo: 0 }],
    gifName,
  } as EffectScript;
}
