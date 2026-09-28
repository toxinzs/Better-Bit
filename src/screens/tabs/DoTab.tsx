import React, { useState } from "react";
import { View } from "react-native";
import SegmentedControl from "../../components/SegmentedControl";
import ActivitiesTab from "./ActivitiesTab";
import CrimeTab from "./CrimeTab";
import { colors } from "../../theme";

type Seg = "fun" | "crime";

// Crime lived on its own bottom tab; it's really one more thing you can go
// do, so it sits next to the everyday activities instead.
export default function DoTab() {
  const [seg, setSeg] = useState<Seg>("fun");
  return (
    <View style={{ flex: 1 }}>
      <SegmentedControl<Seg>
        accent={seg === "crime" ? colors.danger : colors.happiness}
        value={seg}
        onChange={setSeg}
        options={[
          { key: "fun", label: "Activities", icon: "sparkles" },
          { key: "crime", label: "Crime", icon: "skull" },
        ]}
      />
      <View style={{ flex: 1 }}>{seg === "fun" ? <ActivitiesTab /> : <CrimeTab />}</View>
    </View>
  );
}
