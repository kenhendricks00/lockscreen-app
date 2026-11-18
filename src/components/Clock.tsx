import { useWindowDimensions } from 'react-native';
import Svg, { Defs, G, LinearGradient, Stop, Text } from 'react-native-svg';

import { clockFonts } from '../fonts';
import { useSettings } from '../settings';
import { formatClock } from '../time';

const HEIGHT = 112;
const BASELINE = 101;

/** The big glassy clock: a white-to-periwinkle gradient over a bright top rim and a soft bottom edge. */
export function Clock({ now }: { now: Date }) {
  const { width } = useWindowDimensions();
  const font = clockFonts[useSettings().settings.clockFont];
  const time = formatClock(now);
  const cx = width / 2;
  const text = {
    x: cx,
    fontFamily: font.family,
    fontWeight: font.weight,
    fontSize: font.size,
    textAnchor: 'middle' as const,
  };

  return (
    <Svg width={width} height={HEIGHT}>
      <Defs>
        <LinearGradient
          id="glass"
          gradientUnits="userSpaceOnUse"
          x1={cx - 140}
          y1={10}
          x2={cx + 120}
          y2={BASELINE}
        >
          <Stop offset="0" stopColor="#F6FCFF" />
          <Stop offset="0.35" stopColor="#C4C6FB" />
          <Stop offset="0.7" stopColor="#7F98F6" />
          <Stop offset="1" stopColor="#5B84F5" />
        </LinearGradient>
      </Defs>
      <G>
        <Text {...text} y={BASELINE - 1} fill="rgba(255, 255, 255, 0.7)">
          {time}
        </Text>
        <Text {...text} y={BASELINE + 1.5} fill="rgba(25, 35, 110, 0.4)">
          {time}
        </Text>
        <Text {...text} y={BASELINE} fill="url(#glass)">
          {time}
        </Text>
      </G>
    </Svg>
  );
}
