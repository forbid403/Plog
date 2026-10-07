import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design, node 117:141 "Pause") — two rounded bars.
const BAR_1 = 'M34.375 6.875H27.5C26.7406 6.875 26.125 7.49061 26.125 8.25V35.75C26.125 36.5094 26.7406 37.125 27.5 37.125H34.375C35.1344 37.125 35.75 36.5094 35.75 35.75V8.25C35.75 7.49061 35.1344 6.875 34.375 6.875Z';
const BAR_2 = 'M16.5 6.875H9.625C8.86561 6.875 8.25 7.49061 8.25 8.25V35.75C8.25 36.5094 8.86561 37.125 9.625 37.125H16.5C17.2594 37.125 17.875 36.5094 17.875 35.75V8.25C17.875 7.49061 17.2594 6.875 16.5 6.875Z';

export type PauseIconProps = {
  color: string;
  size?: number;
};

export default function PauseIcon({ color, size = 44 }: PauseIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Path d={BAR_1} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={BAR_2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
