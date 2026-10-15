import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const BAG_EMPTY = require('../../assets/litter/bag-empty.png');
const BAG_FULL = require('../../assets/litter/bag-full.png');

// The bag PNGs are 414×405 with a lot of transparent space around the
// drawing, which sits at x 83–337, y 23–354. This icon crops to the drawing
// so a small bag still reads as a bag (and lines up with text beside it).
const IMAGE = { width: 414, height: 405 };
const DRAWING = { left: 83, top: 23, width: 254, height: 331 };
const DRAWING_BOTTOM = DRAWING.top + DRAWING.height;

export type BagFillIconProps = {
  /** 0–1: how full the bag was (D2 fill ratio). */
  fill: number;
  /** Height of the bag drawing; width follows its shape. */
  height: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The Litter Log's bag (D2), shrunk: the same two images and the same fill
 * level for a given ratio — the full bag shows through from the bottom of
 * the image, exactly as litter-log.tsx reveals it — just cropped to the
 * drawing. Used on the My feed card and session detail.
 */
export default function BagFillIcon({ fill, height, style }: BagFillIconProps) {
  const ratio = Math.min(1, Math.max(0, fill));
  const scale = height / DRAWING.height;
  const box = { width: Math.round(DRAWING.width * scale), height };
  const imageSize = { width: IMAGE.width * scale, height: IMAGE.height * scale };

  // Litter Log reveals `ratio` of the whole image height from its bottom;
  // translate that into how much of the drawing it uncovers.
  const revealTop = IMAGE.height * (1 - ratio);
  const fillHeight = Math.max(0, DRAWING_BOTTOM - Math.max(revealTop, DRAWING.top)) * scale;

  return (
    <View style={[box, styles.clip, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image source={BAG_EMPTY} style={[imageSize, styles.image, { left: -DRAWING.left * scale, top: -DRAWING.top * scale }]} />
      <View style={[styles.fill, { height: fillHeight }]}>
        <Image
          source={BAG_FULL}
          style={[imageSize, styles.image, { left: -DRAWING.left * scale, bottom: -(IMAGE.height - DRAWING_BOTTOM) * scale }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
