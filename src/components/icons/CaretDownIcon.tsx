import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design System, node 104:96 "CaretDown") — stroke icon,
// canonical 32×32 viewBox; react-native-svg scales it (and the stroke) to any `size`.
const PATH = 'M26 12L16 22L6 12';

export type CaretDownIconProps = {
  color: string;
  size?: number;
};

export default function CaretDownIcon({ color, size = 32 }: CaretDownIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path d={PATH} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
