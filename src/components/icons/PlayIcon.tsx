import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design, node 117:190 "Play") — canonical 44×44
// viewBox; react-native-svg scales it to any `size` (same approach as
// PauseIcon — confirmed the 30px export is this exact shape scaled 30/44).
const PATH =
  'M12.375 6.85437V37.1456C12.3795 37.3873 12.4476 37.6236 12.5726 37.8306C12.6975 38.0376 12.8748 38.208 13.0866 38.3246C13.2983 38.4412 13.5371 38.4999 13.7788 38.4948C14.0205 38.4897 14.2566 38.4209 14.4633 38.2955L39.227 23.1498C39.4248 23.0301 39.5884 22.8614 39.702 22.66C39.8155 22.4585 39.8751 22.2312 39.8751 22C39.8751 21.7688 39.8155 21.5415 39.702 21.34C39.5884 21.1386 39.4248 20.9699 39.227 20.8502L14.4633 5.70453C14.2566 5.57908 14.0205 5.51033 13.7788 5.50522C13.5371 5.50011 13.2983 5.55882 13.0866 5.67543C12.8748 5.79204 12.6975 5.96242 12.5726 6.16941C12.4476 6.37639 12.3795 6.61265 12.375 6.85437Z';

export type PlayIconProps = {
  color: string;
  size?: number;
};

export default function PlayIcon({ color, size = 44 }: PlayIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Path d={PATH} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
