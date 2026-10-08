import Svg, { Path } from 'react-native-svg';

// Path data from Figma (Plog Design System, node 167:4385 "TelegramLogo") —
// canonical 32×32 viewBox; react-native-svg scales it to any `size`.
const PAPER_PLANE =
  'M10 16.8587L21.2825 26.75C21.4125 26.8647 21.57 26.9436 21.7397 26.979C21.9093 27.0144 22.0853 27.0052 22.2502 26.9521C22.4152 26.899 22.5636 26.804 22.6808 26.6763C22.798 26.5486 22.88 26.3927 22.9188 26.2238L28 4.1525C28.005 4.13037 28.0038 4.1073 27.9967 4.08578C27.9895 4.06425 27.9766 4.04508 27.9594 4.03031C27.9422 4.01554 27.9213 4.00573 27.899 4.00193C27.8766 3.99813 27.8536 4.00049 27.8325 4.00875L2.5 13.9225C2.34274 13.983 2.20935 14.0929 2.11986 14.2357C2.03038 14.3785 1.98962 14.5465 2.0037 14.7144C2.01779 14.8823 2.08597 15.0411 2.19799 15.167C2.31002 15.2929 2.45985 15.379 2.625 15.4125L10 16.8587Z';
const TAIL = 'M10 16.8587L27.9263 4.01125';
const FOLD =
  'M15.5463 21.7225L11.72 25.6925C11.5817 25.8359 11.4038 25.9348 11.209 25.9764C11.0141 26.0181 10.8113 26.0006 10.6265 25.9262C10.4417 25.8518 10.2833 25.7238 10.1717 25.5588C10.0601 25.3938 10.0003 25.1992 10 25V16.8587';

export type TelegramLogoIconProps = {
  color: string;
  size?: number;
};

export default function TelegramLogoIcon({ color, size = 32 }: TelegramLogoIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path d={PAPER_PLANE} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={TAIL} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={FOLD} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
