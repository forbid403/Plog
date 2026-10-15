import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design, node I681:2614;279:421 "X" — Phosphor, regular weight).
const PATHS = [
  'M15.625 4.375L4.375 15.625',
  'M15.625 15.625L4.375 4.375',
];

export type XIconProps = {
  /** Icon color — pass a colour token, never a hardcoded hex. */
  color: string;
  size?: number;
};

export default function XIcon({ color, size = 20 }: XIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {PATHS.map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
