import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design, node 157:1933 "Minus") — stroke icon, canonical
// 20×20 viewBox; react-native-svg scales it to any `size`.

export type MinusIconProps = {
  color: string;
  size?: number;
};

export default function MinusIcon({ color, size = 20 }: MinusIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M3.125 10H16.875" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
