import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design System, node 141:1064 "ArrowRight") —
// canonical 22×22 viewBox; react-native-svg scales it to any `size`.
const PATH_1 = 'M3.4375 11H18.5625';
const PATH_2 = 'M12.375 4.8125L18.5625 11L12.375 17.1875';

export type ArrowRightIconProps = {
  color: string;
  size?: number;
};

export default function ArrowRightIcon({ color, size = 22 }: ArrowRightIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path d={PATH_1} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={PATH_2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
