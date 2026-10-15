import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listBadges, listMySessions, type MySession } from '../../../src/api';
import {
  BeerBottleIcon,
  Button,
  CaretDownIcon,
  DropdownMenu,
  MonthlyLitterChart,
  SneakerMoveIcon,
  TopBar,
  TrashIcon,
  type DropdownAnchor,
} from '../../../src/components';
import { formatDistanceKm, formatLiters } from '../../../src/lib/format';
import {
  availableYears,
  computeBadges,
  computeImpact,
  formatBadgeLabel,
  formatBins,
  formatBottles,
  type Badge,
  type BadgeStatus,
} from '../../../src/lib/impact';
import { shadowLayerToStyle } from '../../../src/lib/shadow';
import { colors, shadows, spacing, typography } from '../../../src/theme';

const TAB_BAR_CLEARANCE = spacing.l + 66 + spacing['3xl'];
const BADGES_PER_ROW = 4;
const BADGE_WIDTH = 64;
const BADGE_ICON_SIZE = 40;

/** Your Impact detail (spec G5; Figma: Plog Design, node 681:2450). */
export default function YourImpactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [yearMenuAnchor, setYearMenuAnchor] = useState<DropdownAnchor | null>(null);
  const yearButtonRef = useRef<View>(null);
  const now = new Date();
  const currentYear = now.getFullYear();
  const [year, setYear] = useState(currentYear);
  const [sessions, setSessions] = useState<MySession[] | null>(null);
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rows, catalog] = await Promise.all([listMySessions(), listBadges()]);
      setSessions(rows);
      setBadges(catalog);
      setLoadFailed(false);
    } catch (e) {
      console.error('[impact] load failed:', e);
      setLoadFailed(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const stats = computeImpact(sessions ?? [], year);
  const years = availableYears(sessions ?? [], currentYear);
  const badgeStatuses = badges && sessions ? computeBadges(badges, sessions) : null;
  // G5.3 [Proposed]: no line or points for months still to come this year.
  const lastMonthIndex = year === currentYear ? now.getMonth() : 11;

  return (
    <View style={styles.screen}>
      <TopBar depth={2} title="Your Impact" showRightIcon={false} onBackPress={() => router.back()} style={styles.topBar} />

      {loadFailed && sessions === null ? (
        <View style={styles.message}>
          <Text style={[textStyle(typography.body.base), styles.subtitleText]}>Couldn&apos;t load your impact.</Text>
          <Button label="Retry" size="small" variant="outlined" onPress={load} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.statsSection}>
            <Pressable
              ref={yearButtonRef}
              onPress={() => yearButtonRef.current?.measureInWindow((x, y, width, height) => setYearMenuAnchor({ x, y, width, height }))}
              accessibilityRole="button"
              accessibilityLabel={`Year ${year}. Change year`}
              style={styles.yearSelector}
            >
              <Text style={[textStyle(typography.body.baseBold), styles.bodyText]}>{year}</Text>
              <CaretDownIcon color={colors.greyScale['800']} size={20} />
            </Pressable>

            <View style={[styles.card, shadowLayerToStyle(shadows.normal[1])]}>
              {sessions === null ? (
                <View style={styles.skeletonCard} />
              ) : (
                <>
                  <View style={styles.collectedRow}>
                    <View style={styles.collected}>
                      <Text style={[textStyle(typography.body.extraSmall), styles.titleText]}>Collected</Text>
                      <Text style={[textStyle(typography.titles.display), styles.titleText]}>{formatLiters(stats.liters)}</Text>
                      <Text style={[textStyle(typography.body.extraSmall), styles.titleText]}>of litter</Text>
                    </View>
                    <View style={styles.equivalents}>
                      <View style={styles.equivalent}>
                        <TrashIcon color={colors.brand.primary['500']} size={spacing['2xl']} />
                        <Text style={[textStyle(typography.body.extraSmall), styles.subtitleText]}>{formatBins(stats.liters)}</Text>
                      </View>
                      <View style={styles.equivalent}>
                        <BeerBottleIcon color={colors.brand.primary['500']} size={spacing['2xl']} />
                        <Text style={[textStyle(typography.body.extraSmall), styles.subtitleText]}>
                          {formatBottles(stats.liters, {
                            one: 'Plastic bottle',
                            many: 'Plastic bottles',
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <MonthlyLitterChart key={year} monthly={stats.monthly} lastMonthIndex={lastMonthIndex} />

                  <View style={styles.totals}>
                    <Total label="Plogged" value={String(stats.ploggingDays)} unit={stats.ploggingDays === 1 ? 'day' : 'days'} />
                    <Total label="Runned" value={formatDistanceKm(stats.distanceKm, 1)} unit="Kilometers" />
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={styles.badgesSection}>
            <Text style={[textStyle(typography.titles.medium), styles.bodyText]}>Badges</Text>
            {badgeStatuses === null ? (
              <View style={styles.skeletonBadges} />
            ) : (
              chunk(badgeStatuses, BADGES_PER_ROW).map((row, i) => (
                <View key={i} style={styles.badgeRow}>
                  {row.map((b) => (
                    <BadgeItem key={b.id} badge={b} />
                  ))}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* A dropdown rather than a bottom sheet: the sheet opened behind the
          floating tab bar, and this matches the sort menu on My. */}
      <DropdownMenu
        anchor={yearMenuAnchor}
        options={years.map((y) => ({ key: y, label: String(y) }))}
        selected={year}
        onSelect={setYear}
        onClose={() => setYearMenuAnchor(null)}
        accessibilityLabel="Choose year"
      />
    </View>
  );
}

function Total({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.total}>
      <Text style={[textStyle(typography.body.extraSmall), styles.subtitleText]}>{label}</Text>
      <View style={styles.totalValue}>
        <Text style={[textStyle(typography.body.smallBold), styles.titleText]}>{value}</Text>
        <Text style={[textStyle(typography.body.extraSmall), styles.titleText]}>{unit}</Text>
      </View>
    </View>
  );
}

/** G5.4 display: earned = green icon + light green border + dark label; locked = grey. */
function BadgeItem({ badge }: { badge: BadgeStatus }) {
  const label = formatBadgeLabel(badge);
  return (
    <View style={styles.badge} accessibilityLabel={`${label}, ${badge.earned ? 'earned' : 'not earned yet'}`}>
      <View style={[styles.badgeCircle, badge.earned ? styles.badgeEarned : styles.badgeLocked]}>
        <SneakerMoveIcon
          color={badge.earned ? colors.brand.primary['300'] : colors.greyScale['400']}
          size={BADGE_ICON_SIZE}
          weight="fill"
        />
      </View>
      <Text
        style={[textStyle(typography.body.small), styles.badgeLabel, badge.earned ? styles.bodyText : styles.lockedText]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));
}

function textStyle(t: { fontFamily: string; fontWeight: string; fontSize: number; letterSpacing: number }): TextStyle {
  return {
    fontFamily: t.fontFamily,
    fontWeight: t.fontWeight as TextStyle['fontWeight'],
    fontSize: t.fontSize,
    letterSpacing: t.letterSpacing,
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.base.white,
  },
  topBar: {
    borderBottomWidth: 0,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['3xl'],
    gap: spacing['3xl'],
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.l,
  },
  statsSection: {
    gap: spacing.l,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing['2xs'],
  },
  card: {
    backgroundColor: colors.base.white,
    borderWidth: 1,
    borderColor: colors.opacity.grey12,
    borderRadius: spacing.m,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.l,
    gap: spacing.l,
  },
  skeletonCard: {
    height: 400,
    borderRadius: spacing.m,
    backgroundColor: colors.greyScale['100'],
  },
  collectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collected: {
    gap: spacing['2xs'],
  },
  equivalents: {
    gap: spacing.m,
  },
  equivalent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2xs'],
  },
  totals: {
    flexDirection: 'row',
    gap: spacing['3xl'],
  },
  total: {
    gap: spacing['2xs'],
  },
  totalValue: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing['3xs'],
  },
  titleText: {
    color: colors.greyScale['900'],
  },
  bodyText: {
    color: colors.greyScale['800'],
  },
  subtitleText: {
    color: colors.greyScale['600'],
  },
  lockedText: {
    color: colors.greyScale['400'],
  },
  badgesSection: {
    gap: spacing.l,
  },
  skeletonBadges: {
    height: 200,
    borderRadius: spacing.m,
    backgroundColor: colors.greyScale['100'],
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    width: BADGE_WIDTH,
    alignItems: 'center',
    gap: spacing['2xs'],
    overflow: 'visible',
  },
  badgeLabel: {
    // Figma lets labels run wider than the 64 circle, centred under it.
    width: BADGE_WIDTH + spacing['3xl'],
    textAlign: 'center',
  },
  badgeCircle: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderRadius: spacing.full,
    borderWidth: 2,
    backgroundColor: colors.opacity.white50,
  },
  badgeEarned: {
    borderColor: colors.brand.primary['100'],
  },
  badgeLocked: {
    borderColor: colors.opacity.grey8,
  },
});
