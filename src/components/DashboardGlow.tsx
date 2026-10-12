import { StyleSheet } from 'react-native';
import Svg, { Ellipse, FeGaussianBlur, Filter, G } from 'react-native-svg';
import { colors } from '../theme';

// Figma (Plog Design, node 618:4008 "Group 4"): six blurred brand-green
// ellipses behind the Home dashboard cards. Geometry and opacities are the
// export's, in its own 402×459 frame. Figma's mix-blend-mode: multiply has
// no React Native equivalent, so it's dropped.
const BLOBS = [
  { cx: 172, cy: 133, rx: 116, ry: 90, opacity: 0.3 },
  { cx: 200.332, cy: 385.519, rx: 169.645, ry: 88.9122, opacity: 0.2 },
  { cx: 97.5, cy: 261, rx: 107.5, ry: 101, opacity: 0.4 },
  { cx: 210, cy: 280.5, rx: 70, ry: 66.5, opacity: 0.9 },
  { cx: 319.423, cy: 305.667, rx: 102.578, ry: 101.888, opacity: 0.4 },
  { cx: 184.901, cy: 197.563, rx: 45.4384, ry: 21.6646, opacity: 0.3 },
];

/** Decorative background for the Home dashboard. Fills its (overflow-hidden) parent. */
export default function DashboardGlow() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 402 459" preserveAspectRatio="xMidYMin slice" pointerEvents="none">
      <Filter id="dashboardGlowBlur" x="-50%" y="-50%" width="200%" height="200%">
        <FeGaussianBlur stdDeviation={50} />
      </Filter>
      <G filter="url(#dashboardGlowBlur)">
        {BLOBS.map((b, i) => (
          <Ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={colors.brand.primary['700']} fillOpacity={b.opacity} />
        ))}
      </G>
    </Svg>
  );
}
