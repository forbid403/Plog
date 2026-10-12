import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design, node 702:1919 "Flame" — Phosphor, fill weight).
const PATH =
  'M19.0083 5.63065C17.6481 4.19729 16.1175 2.93592 14.4506 1.87471C14.3145 1.79295 14.1588 1.74976 14 1.74976C13.8412 1.74976 13.6855 1.79295 13.5494 1.87471C11.8825 2.93592 10.3519 4.19729 8.99172 5.63065C5.97078 8.80253 4.375 12.3014 4.375 15.75C4.375 18.3027 5.38906 20.7509 7.1941 22.5559C8.99914 24.361 11.4473 25.375 14 25.375C16.5527 25.375 19.0009 24.361 20.8059 22.5559C22.6109 20.7509 23.625 18.3027 23.625 15.75C23.625 12.3014 22.0292 8.80253 19.0083 5.63065ZM10.5 20.125C10.5 17.0986 12.9642 14.9538 14 14.186C15.0369 14.9516 17.5 17.0986 17.5 20.125C17.5 21.0533 17.1313 21.9435 16.4749 22.5999C15.8185 23.2563 14.9283 23.625 14 23.625C13.0717 23.625 12.1815 23.2563 11.5251 22.5999C10.8687 21.9435 10.5 21.0533 10.5 20.125Z';

export type FlameIconProps = {
  /** Icon color — pass a colour token, never a hardcoded hex. */
  color: string;
  size?: number;
};

export default function FlameIcon({ color, size = 28 }: FlameIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d={PATH} fill={color} />
    </Svg>
  );
}
