import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design, node 690:1939 "ArrowsDownUp" — Phosphor, regular weight).
const PATHS = [
  'M14 22L10 26L6 22',
  'M10 6V26',
  'M18 10L22 6L26 10',
  'M22 26V6',
];

export type ArrowsDownUpIconProps = {
  /** Icon color — pass a colour token, never a hardcoded hex. */
  color: string;
  size?: number;
};

export default function ArrowsDownUpIcon({ color, size = 32 }: ArrowsDownUpIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {PATHS.map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
