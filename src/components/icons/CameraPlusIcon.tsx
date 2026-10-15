import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design, node 681:2612 "CameraPlus" — Phosphor, regular weight).
const PATHS = [
  'M16 13V21',
  'M12 17H20',
  'M10 8L11.7037 5.445C11.795 5.30819 11.9186 5.196 12.0636 5.11838C12.2086 5.04076 12.3705 5.0001 12.535 5H19.465C19.6295 5.0001 19.7914 5.04076 19.9364 5.11838C20.0814 5.196 20.205 5.30819 20.2962 5.445L22 8H26C26.5304 8 27.0391 8.21071 27.4142 8.58579C27.7893 8.96086 28 9.46957 28 10V24C28 24.5304 27.7893 25.0391 27.4142 25.4142C27.0391 25.7893 26.5304 26 26 26H6C5.46957 26 4.96086 25.7893 4.58579 25.4142C4.21071 25.0391 4 24.5304 4 24V10C4 9.46957 4.21071 8.96086 4.58579 8.58579C4.96086 8.21071 5.46957 8 6 8H10Z',
];

export type CameraPlusIconProps = {
  /** Icon color — pass a colour token, never a hardcoded hex. */
  color: string;
  size?: number;
};

export default function CameraPlusIcon({ color, size = 32 }: CameraPlusIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {PATHS.map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
