import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design, node 690:1906 "Export" — Phosphor, regular weight).
const PATHS = [
  'M22 13H25C25.2652 13 25.5196 13.1054 25.7071 13.2929C25.8946 13.4804 26 13.7348 26 14V26C26 26.2652 25.8946 26.5196 25.7071 26.7071C25.5196 26.8946 25.2652 27 25 27H7C6.73478 27 6.48043 26.8946 6.29289 26.7071C6.10536 26.5196 6 26.2652 6 26V14C6 13.7348 6.10536 13.4804 6.29289 13.2929C6.48043 13.1054 6.73478 13 7 13H10',
  'M11 8L16 3L21 8',
  'M16 3V17',
];

export type ExportIconProps = {
  /** Icon color — pass a colour token, never a hardcoded hex. */
  color: string;
  size?: number;
};

export default function ExportIcon({ color, size = 32 }: ExportIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {PATHS.map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
