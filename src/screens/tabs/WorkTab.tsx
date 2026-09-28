import React, { useState } from "react";
import { View } from "react-native";
import SegmentedControl from "../../components/SegmentedControl";
import CareerTab from "./CareerTab";
import SchoolTab from "./SchoolTab";
import { colors } from "../../theme";

type Seg = "job" | "school";

// Job and School used to be two of seven bottom tabs; they're two halves of
// the same "what do you do all day" question, so they share one tab now.
export default function WorkTab({ initial = "job" }: { initial?: Seg }) {
  const [seg, setSeg] = useState<Seg>(initial);
  return (
    <View style={{ flex: 1 }}>
      <SegmentedControl<Seg>
        accent={colors.smarts}
        value={seg}
        onChange={setSeg}
        options={[
          { key: "job", label: "Career", icon: "briefcase" },
          { key: "school", label: "School", icon: "school" },
        ]}
      />
      <View style={{ flex: 1 }}>{seg === "job" ? <CareerTab /> : <SchoolTab />}</View>
    </View>
  );
}
