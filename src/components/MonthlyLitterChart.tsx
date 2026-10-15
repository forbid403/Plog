import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { chartAxisMax } from '../lib/impact';
import { colors, spacing, typography } from '../theme';

export type MonthlyLitterChartProps = {
  /** Litres per month, Jan..Dec. */
  monthly: number[];
  /** Months after this index (0 = Jan) are in the future: label only, no line or point (G5.3). 11 for a past year. */
  lastMonthIndex: number;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_PER_PAGE = 6; // Figma 681:2472 shows half a year at a time
const PLOT_HEIGHT = 200;
const X_AXIS_HEIGHT = 38;
const Y_AXIS_WIDTH = 32;
const EDGE = 6; // keeps end points and their markers inside the plot
const POINT_RADIUS = 4;
const TICKS = 5;

/**
 * Monthly litter line chart (G5.3; Figma: Plog Design, node 681:2472).
 * Product decision 2026-10-14: show 6 months like Figma — Jan–Jun and
 * Jul–Dec are two pages you swipe between, sharing one y-axis so the halves
 * compare. Opens on the half containing `lastMonthIndex`.
 */
export default function MonthlyLitterChart({ monthly, lastMonthIndex }: MonthlyLitterChartProps) {
  const [pageWidth, setPageWidth] = useState(0);
  const axisMax = chartAxisMax(monthly);
  const startPage = lastMonthIndex >= MONTHS_PER_PAGE ? 1 : 0;

  const onLayout = (e: LayoutChangeEvent) => setPageWidth(e.nativeEvent.layout.width);

  const x = (i: number) => EDGE + (i / (MONTHS_PER_PAGE - 1)) * (pageWidth - EDGE * 2);
  const y = (value: number) => EDGE + (1 - value / axisMax) * (PLOT_HEIGHT - EDGE * 2);
  const tickValues = Array.from({ length: TICKS + 1 }, (_, i) => (axisMax / TICKS) * (TICKS - i));

  return (
    <View style={styles.row}>
      <View style={styles.pages} onLayout={onLayout}>
        {pageWidth > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: startPage * pageWidth, y: 0 }}
          >
            {[0, 1].map((page) => {
              const months = Array.from({ length: MONTHS_PER_PAGE }, (_, i) => page * MONTHS_PER_PAGE + i);
              const shown = months.filter((m) => m <= lastMonthIndex);
              const points = shown.map((m) => ({ cx: x(m - page * MONTHS_PER_PAGE), cy: y(monthly[m] ?? 0) }));
              return (
                <View key={page} style={{ width: pageWidth }}>
                  <Svg width={pageWidth} height={PLOT_HEIGHT}>
                    {tickValues.map((_, i) => {
                      const ty = EDGE + (i / TICKS) * (PLOT_HEIGHT - EDGE * 2);
                      return <Line key={`h${i}`} x1={0} x2={pageWidth} y1={ty} y2={ty} stroke={colors.opacity.black12} strokeDasharray="2 2" />;
                    })}
                    {months.map((m, i) => (
                      <Line key={`v${m}`} x1={x(i)} x2={x(i)} y1={0} y2={PLOT_HEIGHT} stroke={colors.opacity.black12} strokeDasharray="2 2" />
                    ))}
                    {points.length > 1 && (
                      <Polyline
                        points={points.map((p) => `${p.cx},${p.cy}`).join(' ')}
                        fill="none"
                        stroke={colors.brand.primary['500']}
                        strokeWidth={2}
                        strokeLinejoin="round"
                      />
                    )}
                    {points.map((p, i) => (
                      <Circle key={i} cx={p.cx} cy={p.cy} r={POINT_RADIUS} fill={colors.base.white} stroke={colors.brand.primary['500']} />
                    ))}
                  </Svg>
                  <View style={styles.xAxis}>
                    {months.map((m, i) => (
                      <Text key={m} style={[styles.axisText, styles.xLabel, { left: x(i) - X_LABEL_WIDTH / 2 }]}>
                        {MONTHS[m]}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
      <View style={styles.yAxis}>
        {tickValues.map((v, i) => (
          <Text key={v} style={[styles.axisText, styles.yLabel, { top: EDGE + (i / TICKS) * (PLOT_HEIGHT - EDGE * 2) - Y_LABEL_HALF_HEIGHT }]}>
            {Number.isInteger(v) ? v : v.toFixed(1)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const X_LABEL_WIDTH = 32;
const Y_LABEL_HALF_HEIGHT = 8;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  pages: {
    flex: 1,
  },
  xAxis: {
    height: X_AXIS_HEIGHT,
  },
  xLabel: {
    position: 'absolute',
    top: spacing.s,
    width: X_LABEL_WIDTH,
    textAlign: 'center',
  },
  yAxis: {
    width: Y_AXIS_WIDTH,
    height: PLOT_HEIGHT,
  },
  yLabel: {
    position: 'absolute',
    left: spacing['2xs'],
  },
  axisText: {
    fontFamily: typography.caption.fontFamily,
    fontWeight: typography.caption.fontWeight,
    fontSize: typography.caption.fontSize,
    letterSpacing: typography.caption.letterSpacing,
    color: colors.greyScale['700'],
  },
});
