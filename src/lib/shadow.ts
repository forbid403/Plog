/** Converts one design-token shadow layer (x/y/blur/spread/8-digit-hex color)
 * into a React Native shadow style. RN only renders a single shadow layer
 * natively (iOS: shadow*, Android: elevation), so a multi-layer token like
 * `shadows.normal` needs one representative layer picked by the caller —
 * this doesn't merge layers, it just converts units.
 */
export type ShadowLayer = { x: number; y: number; blur: number; spread: number; color: string };

export function shadowLayerToStyle(layer: ShadowLayer) {
  const hex = layer.color.slice(0, 7);
  const alphaHex = layer.color.slice(7, 9);
  const opacity = alphaHex ? parseInt(alphaHex, 16) / 255 : 1;
  return {
    shadowColor: hex,
    shadowOffset: { width: layer.x, height: layer.y },
    shadowOpacity: opacity,
    shadowRadius: layer.blur,
  };
}
