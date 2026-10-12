import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLocalWeather, getMyProfile, listSessionStarts, type LocalWeather, type SessionStart } from '../../src/api';
import { DashboardGlow, FlameIcon, SneakerMoveIcon, TopBar, UmbrellaIcon } from '../../src/components';
import { usePlogSession } from '../../src/hooks/usePlogSession';
import { formatPrecipitationMm, formatStreakDays, formatTemperatureC } from '../../src/lib/format';
import { hasCompletedOnboarding } from '../../src/lib/onboardingStorage';
import { computeCurrentStreak, computeThisWeek, localDateKey, type WeekDay } from '../../src/lib/streak';
import { colors, spacing, typography } from '../../src/theme';

type WeatherState =
  | { kind: 'loading' }
  | { kind: 'ready'; weather: LocalWeather }
  | { kind: 'no-permission' }
  | { kind: 'error' };

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Floating tab bar footprint (app/(tabs)/_layout.tsx): sits `insets.bottom + 16`
// from the bottom and is 66 tall (8 + 50 + 8, BottomNavigation). Content
// scrolls clear of it, plus Figma's 32 section gap.
const TAB_BAR_CLEARANCE = spacing.l + 66 + spacing['3xl'];

/** Home (spec Part B; Figma: Plog Design, node 562:4408). Recommended Routes (B5) not built yet. */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, hydrated } = usePlogSession();
  const [checked, setChecked] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionStart[] | null>(null);
  const [weather, setWeather] = useState<WeatherState>({ kind: 'loading' });

  // A2: onboarding is shown once per install, gated here since Home is
  // this app's actual entry point (no separate root index route — see
  // docs/todo-onboarding.md's "Routing" note for why).
  useEffect(() => {
    hasCompletedOnboarding().then((done) => {
      if (!done) router.replace('/onboarding');
      else setChecked(true);
    });
  }, [router]);

  // Relaunching the app always lands here (cold start has no "last tab"
  // memory), but the tab bar — the only way to reach the Plog tab — is
  // hidden the whole time a session is recording/paused (spec 0.3). With
  // no redirect, an in-progress session (C3.1's whole point: it survives
  // the app being killed) became unreachable: stuck on Home, no tab bar,
  // no way back to it. `hydrated` guards against usePlogSession's status
  // defaulting to 'idle' before its own async DB read finishes — without
  // it this fires on that false default and never redirects.
  useEffect(() => {
    if (checked && hydrated && status !== 'idle') router.replace('/plog');
  }, [checked, hydrated, status, router]);

  // Refresh on every visit to Home, so a just-finished plog shows up in the
  // streak and week strip (B2: weather is cached 30 min inside getLocalWeather).
  useFocusEffect(
    useCallback(() => {
      if (!checked) return;
      let cancelled = false;

      getMyProfile()
        .then((profile) => !cancelled && setAvatarUrl(profile?.avatarUrl ?? null))
        .catch((e) => console.error('[home] profile load failed:', e));

      listSessionStarts()
        .then((rows) => !cancelled && setSessions(rows))
        .catch((e) => console.error('[home] sessions load failed:', e));

      loadWeather().then((next) => !cancelled && setWeather(next));

      return () => {
        cancelled = true;
      };
    }, [checked])
  );

  if (!checked) return null;

  const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const todayKey = localDateKey(new Date().toISOString(), deviceTimeZone);
  const streak = sessions ? computeCurrentStreak(sessions, todayKey) : null;
  const week = sessions ? computeThisWeek(sessions, todayKey, deviceTimeZone) : null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_CLEARANCE }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.dashboard}>
        <DashboardGlow />
        <TopBar depth={1} title="Home" avatarSource={avatarUrl ? { uri: avatarUrl } : undefined} style={styles.topBar} />

        <View style={styles.dashboardContent}>
          <Text style={[textStyle(typography.titles.medium), styles.sectionTitle]}>Dashboard</Text>

          <View style={styles.cardRow}>
            <GlassCard style={styles.weatherCard}>
              <WeatherCardBody state={weather} />
            </GlassCard>

            <GlassCard style={styles.streakCard}>
              <View style={styles.cardTitle}>
                <Text style={[textStyle(typography.body.extraSmall), styles.titleText]}>Streaks</Text>
                <Text style={[textStyle(typography.titles.medium), styles.titleText]}>
                  {streak === null ? '–' : formatStreakDays(streak)}
                </Text>
              </View>
              {/* B3 [Proposed]: coloured when the streak is alive, grey at 0 */}
              <FlameIcon color={streak ? colors.red['400'] : colors.greyScale['500']} />
            </GlassCard>
          </View>

          <GlassCard style={styles.weekCard}>
            <Text style={[textStyle(typography.body.extraSmall), styles.bodyText]}>This Week</Text>
            <View style={styles.weekRow}>
              {WEEKDAY_LETTERS.map((letter, i) => (
                <View key={i} style={styles.weekDay}>
                  <Text style={[textStyle(typography.body.extraSmall), styles.bodyText]}>{letter}</Text>
                  <DayCircle day={week?.[i]} />
                </View>
              ))}
            </View>
          </GlassCard>
        </View>
      </View>
    </ScrollView>
  );
}

async function loadWeather(): Promise<WeatherState> {
  try {
    let permission = await Location.getForegroundPermissionsAsync();
    // 0.4: location is first requested right after onboarding, i.e. here.
    if (permission.status !== 'granted' && permission.canAskAgain) {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    if (permission.status !== 'granted') return { kind: 'no-permission' };

    const position =
      (await Location.getLastKnownPositionAsync()) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { kind: 'ready', weather: await getLocalWeather(position.coords) };
  } catch (e) {
    console.error('[home] weather load failed:', e);
    return { kind: 'error' };
  }
}

function WeatherCardBody({ state }: { state: WeatherState }) {
  if (state.kind === 'loading') {
    return <ActivityIndicator color={colors.greyScale['600']} style={styles.weatherLoading} />;
  }
  if (state.kind === 'no-permission') {
    return (
      <Pressable onPress={() => Linking.openSettings()} accessibilityRole="link">
        <Text style={[textStyle(typography.body.extraSmall), styles.titleText]}>Turn on location to see local weather</Text>
      </Pressable>
    );
  }
  if (state.kind === 'error') {
    return <Text style={[textStyle(typography.body.extraSmall), styles.titleText]}>Weather unavailable</Text>;
  }

  const { suburb, tempC, precipitationMm } = state.weather;
  return (
    <>
      <View style={styles.cardTitle}>
        <Text style={[textStyle(typography.body.extraSmall), styles.titleText]} numberOfLines={1}>
          {suburb ?? ''}
        </Text>
        <Text style={[textStyle(typography.titles.medium), styles.titleText]}>{formatTemperatureC(tempC)}</Text>
      </View>
      <View style={styles.rainRow}>
        <View style={styles.rain}>
          <UmbrellaIcon color={colors.blue['500']} />
          <Text style={[textStyle(typography.body.extraSmall), styles.rainText]}>{formatPrecipitationMm(precipitationMm)}</Text>
        </View>
      </View>
    </>
  );
}

/** B4 day states. `undefined` while sessions are loading — an empty light circle. */
function DayCircle({ day }: { day: WeekDay | undefined }) {
  if (day?.status === 'plogged') {
    return (
      <View style={[styles.dayCircle, styles.dayPlogged]}>
        <SneakerMoveIcon color={colors.brand.primary['500']} size={spacing.l} weight="fill" />
      </View>
    );
  }
  if (day?.status === 'missed') return <View style={[styles.dayCircle, styles.dayMissed]} />;
  if (!day) return <View style={[styles.dayCircle, styles.dayFuture]} />;

  const isToday = day.status === 'today';
  return (
    <View style={[styles.dayCircle, isToday ? styles.dayToday : styles.dayFuture]}>
      <Text style={[textStyle(typography.body.extraSmall), isToday ? styles.bodyText : styles.subtitleText]}>
        {day.dayOfMonth}
      </Text>
    </View>
  );
}

function GlassCard({ style, children }: { style: object; children: React.ReactNode }) {
  return (
    <View style={[styles.glass, style]}>
      <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.glassTint]} />
      {children}
    </View>
  );
}

function textStyle(t: { fontFamily: string; fontWeight: string; fontSize: number; letterSpacing: number }): TextStyle {
  return {
    fontFamily: t.fontFamily,
    fontWeight: t.fontWeight as TextStyle['fontWeight'],
    fontSize: t.fontSize,
    letterSpacing: t.letterSpacing,
  };
}

// Figma card widths (193 / 153) — kept as a ratio so the row fits any phone width.
const WEATHER_CARD_FLEX = 193;
const STREAK_CARD_FLEX = 153;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.base.white,
  },
  dashboard: {
    // Figma uses #E7FFAC, which isn't in tokens.json yet — nearest token
    // until it's added in Tokens Studio.
    backgroundColor: colors.green['100'],
    borderBottomLeftRadius: spacing['4xl'],
    borderBottomRightRadius: spacing['4xl'],
    overflow: 'hidden',
  },
  topBar: {
    borderBottomWidth: 0,
  },
  dashboardContent: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.s,
    paddingBottom: spacing.xl,
    gap: spacing.m,
  },
  sectionTitle: {
    color: colors.greyScale['900'],
    marginBottom: spacing['3xs'],
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  glass: {
    borderRadius: spacing['4xl'],
    overflow: 'hidden',
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing.l,
  },
  glassTint: {
    backgroundColor: colors.opacity.white50,
  },
  weatherCard: {
    flex: WEATHER_CARD_FLEX,
    justifyContent: 'center',
  },
  weatherLoading: {
    paddingVertical: spacing['2xl'],
  },
  streakCard: {
    flex: STREAK_CARD_FLEX,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardTitle: {
    alignSelf: 'stretch',
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
  rainRow: {
    alignItems: 'flex-end',
  },
  rain: {
    alignItems: 'center',
  },
  rainText: {
    color: colors.base.white,
  },
  weekCard: {
    gap: spacing.m,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.s,
  },
  weekDay: {
    width: spacing['2xl'],
    alignItems: 'center',
    gap: spacing['2xs'],
  },
  dayCircle: {
    width: spacing['2xl'],
    height: spacing['2xl'],
    borderRadius: spacing.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPlogged: {
    backgroundColor: colors.brand.primary['50'],
    borderColor: colors.brand.primary['500'],
  },
  dayMissed: {
    backgroundColor: colors.opacity.white50,
    borderColor: colors.greyScale['400'],
  },
  dayToday: {
    backgroundColor: colors.base.white,
    borderColor: colors.greyScale['700'],
  },
  dayFuture: {
    backgroundColor: colors.base.white,
    borderColor: colors.greyScale['400'],
  },
});
