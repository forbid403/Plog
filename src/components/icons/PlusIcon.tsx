import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design, node 157:1892 "Plus") — stroke icon, canonical
// 20×20 viewBox; react-native-svg scales it to any `size`.

export type PlusIconProps = {
  color: string;
  size?: number;
};

export default function PlusIcon({ color, size = 20 }: PlusIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M3.125 10H16.875" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 3.125V16.875" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
