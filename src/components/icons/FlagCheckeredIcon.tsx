import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design, node 117:314 "FlagCheckered").
const PATH_1 =
  'M5.625 20.625C13.125 14.1293 18.75 27.1207 26.25 20.625V6.5625C18.75 13.0582 13.125 0.066797 5.625 6.5625V26.25';
const PATH_2 = 'M5.625 13.5937C13.125 7.09805 18.75 20.0895 26.25 13.5937';
const PATH_3 = 'M19.6875 8.14219V22.2047';
const PATH_4 = 'M12.1875 4.98281V19.0453';

export type FlagCheckeredIconProps = {
  color: string;
  size?: number;
};

export default function FlagCheckeredIcon({ color, size = 30 }: FlagCheckeredIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <Path d={PATH_1} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={PATH_2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={PATH_3} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={PATH_4} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
