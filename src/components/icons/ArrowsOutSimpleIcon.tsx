import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design, node 690:1885 "ArrowsOutSimple" — Phosphor, regular weight).
const PATHS = [
  'M20 6H26V12',
  'M18 14L26 6',
  'M12 26H6V20',
  'M14 18L6 26',
];

export type ArrowsOutSimpleIconProps = {
  /** Icon color — pass a colour token, never a hardcoded hex. */
  color: string;
  size?: number;
};

export default function ArrowsOutSimpleIcon({ color, size = 32 }: ArrowsOutSimpleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {PATHS.map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
