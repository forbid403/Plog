import Svg, { Circle, Line } from 'react-native-svg';

// Generic "my location" crosshair — not from Figma (no node was given for
// the idle screen's re-centre button, C2 [Recommended]); swap for a traced
// asset if/when one's designed.
export type LocateIconProps = {
  color: string;
  size?: number;
};

export default function LocateIcon({ color, size = 24 }: LocateIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={2} />
      <Line x1={12} y1={2} x2={12} y2={5} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={12} y1={19} x2={12} y2={22} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={2} y1={12} x2={5} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={19} y1={12} x2={22} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
