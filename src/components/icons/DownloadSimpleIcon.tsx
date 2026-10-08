import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design System, node 167:4043 "DownloadSimple")
// — canonical 32×32 viewBox; react-native-svg scales it to any `size`.
const STEM = 'M16 18V4';
const TRAY = 'M27 18V26H5V18';
const ARROWHEAD = 'M21 13L16 18L11 13';

export type DownloadSimpleIconProps = {
  color: string;
  size?: number;
};

export default function DownloadSimpleIcon({ color, size = 32 }: DownloadSimpleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path d={STEM} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={TRAY} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={ARROWHEAD} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
