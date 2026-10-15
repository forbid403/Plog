import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteAccount, getMyProfile, listMySessions, type MySession } from '../../../src/api';
import {
  ArrowsDownUpIcon,
  BeerBottleIcon,
  Button,
  DropdownMenu,
  MagnifyingGlassIcon,
  PlogCard,
  TopBar,
  TrashIcon,
  type DropdownAnchor,
} from '../../../src/components';
import { formatLiters } from '../../../src/lib/format';
import { computeImpact, formatBins, formatBottles } from '../../../src/lib/impact';
import { SESSION_SORT_OPTIONS, sortSessions, type SessionSort } from '../../../src/lib/session-sort';
import { colors, shadows, spacing, typography } from '../../../src/theme';
import { shadowLayerToStyle } from '../../../src/lib/shadow';

const SEARCH_DEBOUNCE_MS = 300; // G4.1 [Proposed]
// Floating tab bar footprint — same clearance as Home (app/(tabs)/index.tsx).
const TAB_BAR_CLEARANCE = spacing.l + 66 + spacing['3xl'];
const IMPACT_CARD_HEIGHT = 120;
const IMPACT_ICON_SIZE = 36;

/** My tab root (spec G1–G4, G8; Figma: Plog Design, node 690:1861). */
export default function MyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [sessions, setSessions] = useState<MySession[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sort, setSort] = useState<SessionSort>('recent');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<DropdownAnchor | null>(null);
  const sortButtonRef = useRef<View>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profile, rows] = await Promise.all([getMyProfile(), listMySessions()]);
      setAvatarUrl(profile?.avatarUrl ?? null);
      setSessions(rows);
      setLoadFailed(false);
    } catch (e) {
      console.error('[my] load failed:', e);
      setLoadFailed(true);
    }
  }, []);

  // Refresh whenever My comes back into view (after a plog, an edit or a delete).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const visibleSessions = useMemo(() => {
    if (!sessions) return [];
    // G4.1: title + place name, partial, case-insensitive.
    const matches = debouncedQuery
      ? sessions.filter((s) => `${s.title} ${s.placeName ?? ''}`.toLowerCase().includes(debouncedQuery))
      : sessions;
    return sortSessions(matches, sort);
  }, [sessions, debouncedQuery, sort]);

  const allTime = computeImpact(sessions ?? [], null);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Account deletion — kept from the previous My placeholder (Apple 5.1.1(v) /
  // Google Play require it; not in the spec or Figma).
  const handleDeleteAccount = () => {
    Alert.alert('Delete your account?', 'This permanently deletes your profile, sessions, and photos. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: confirmDeleteAccount },
    ]);
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      router.replace('/onboarding-profile');
    } catch (e) {
      console.error('[my] account deletion failed:', e);
      Alert.alert('Could not delete your account', 'Check your connection and try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <TopBar depth={1} title="My" avatarSource={avatarUrl ? { uri: avatarUrl } : undefined} style={styles.topBar} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE }]}
        stickyHeaderIndices={[2]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 0 — Your Impact */}
        <View style={styles.impactSection}>
          <Text style={[textStyle(typography.titles.medium), styles.titleText]}>Your Impact</Text>
          <Pressable
            onPress={() => router.push('/my/impact')}
            accessibilityRole="button"
            accessibilityLabel="Your Impact details"
            style={[styles.impactCard, shadowLayerToStyle(shadows.normal[1])]}
          >
            {sessions === null && !loadFailed ? (
              <View style={[styles.skeleton, styles.skeletonImpact]} />
            ) : (
              <>
                <View style={styles.impactTotal}>
                  <Text style={[textStyle(typography.body.extraSmall), styles.bodyText]}>Total Plogged</Text>
                  <Text style={[textStyle(typography.titles.large), styles.bodyText]}>{formatLiters(allTime.liters)}</Text>
                </View>
                <View style={styles.equivalents}>
                  <Equivalent
                    icon={<TrashIcon color={colors.brand.primary['500']} size={IMPACT_ICON_SIZE} />}
                    label={formatBins(allTime.liters)}
                  />
                  <Equivalent
                    icon={<BeerBottleIcon color={colors.brand.primary['500']} size={IMPACT_ICON_SIZE} />}
                    label={formatBottles(allTime.liters)}
                  />
                </View>
              </>
            )}
          </Pressable>
        </View>

        {/* 1 — section title */}
        <Text style={[textStyle(typography.titles.medium), styles.titleText, styles.recentTitle]}>Recent Plogs</Text>

        {/* 2 — sticky search + sort (G4.1). Wrapped: ScrollView replaces a
            sticky child's own style, which flattened this row into a column. */}
        <View style={styles.toolSticky}>
          <View style={styles.tool}>
            <View style={styles.search}>
              <MagnifyingGlassIcon color={colors.greyScale['500']} size={20} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search sessions"
                placeholderTextColor={colors.greyScale['500']}
                returnKeyType="search"
                autoCorrect={false}
                style={[textStyle(typography.body.base), styles.searchInput]}
              />
            </View>
            <Pressable
              ref={sortButtonRef}
              onPress={() => sortButtonRef.current?.measureInWindow((x, y, width, height) => setSortMenuAnchor({ x, y, width, height }))}
              accessibilityRole="button"
              accessibilityLabel={`Sort: ${SESSION_SORT_OPTIONS.find((o) => o.key === sort)?.label}`}
              hitSlop={spacing.s}
            >
              <ArrowsDownUpIcon color={colors.greyScale['900']} />
            </Pressable>
          </View>
        </View>

        {/* 3 — feed */}
        <View style={styles.feed}>
          {loadFailed && sessions === null ? (
            <View style={styles.message}>
              <Text style={[textStyle(typography.body.base), styles.subtitleText]}>Couldn&apos;t load your plogs.</Text>
              <Button label="Retry" size="small" variant="outlined" onPress={load} style={styles.centered} />
            </View>
          ) : sessions === null ? (
            <View style={[styles.skeleton, styles.skeletonCard]} />
          ) : sessions.length === 0 ? (
            <View style={styles.message}>
              <Text style={[textStyle(typography.body.base), styles.subtitleText]}>Your plogs will show up here.</Text>
              <Button label="Start plogging" onPress={() => router.navigate('/plog')} style={styles.centered} />
            </View>
          ) : visibleSessions.length === 0 ? (
            <Text style={[textStyle(typography.body.base), styles.subtitleText, styles.noResults]}>No sessions found</Text>
          ) : (
            visibleSessions.map((s) => (
              <PlogCard
                key={s.id}
                session={s}
                onPress={() =>
                  router.push({
                    pathname: '/session/[id]',
                    params: { id: s.id },
                  })
                }
                onShare={() =>
                  router.push({
                    pathname: '/impact-card',
                    params: { sessionId: s.id },
                  })
                }
              />
            ))
          )}
        </View>

        {/* 4 — pushes Delete account to the bottom when the feed is short */}
        <View style={styles.spacer} />

        {/* 5 — account deletion */}
        <Pressable onPress={handleDeleteAccount} disabled={deleting} style={styles.deleteAccount} accessibilityRole="button">
          {deleting ? (
            <ActivityIndicator color={colors.red['700']} />
          ) : (
            <Text style={[textStyle(typography.body.small), styles.deleteAccountText]}>Delete account</Text>
          )}
        </Pressable>
      </ScrollView>

      <DropdownMenu
        anchor={sortMenuAnchor}
        options={SESSION_SORT_OPTIONS}
        selected={sort}
        onSelect={setSort}
        onClose={() => setSortMenuAnchor(null)}
        align="right"
        accessibilityLabel="Sort sessions"
      />
    </View>
  );
}

function Equivalent({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.equivalent}>
      {icon}
      <Text style={[textStyle(typography.body.extraSmall), styles.subtitleText]} numberOfLines={1}>
        {label}
      </Text>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.base.white,
  },
  topBar: {
    marginHorizontal: spacing['2xl'],
    paddingHorizontal: 0,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.l,
  },
  spacer: {
    flex: 1,
  },
  centered: {
    alignSelf: 'center',
  },
  impactSection: {
    gap: spacing.l,
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
  impactCard: {
    height: IMPACT_CARD_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.l,
    backgroundColor: colors.base.white,
    borderWidth: 1,
    borderColor: colors.opacity.grey12,
    borderRadius: spacing.m,
  },
  impactTotal: {
    gap: spacing['2xs'],
  },
  equivalents: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.l,
  },
  equivalent: {
    alignItems: 'center',
    gap: spacing['2xs'],
    minWidth: 45,
  },
  recentTitle: {
    marginTop: spacing['3xl'],
  },
  toolSticky: {
    backgroundColor: colors.base.white,
  },
  tool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.l,
    paddingVertical: spacing.m,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    padding: spacing.m,
    borderRadius: spacing.full,
    backgroundColor: colors.greyScale['100'],
  },
  searchInput: {
    flex: 1,
    padding: 0,
    color: colors.greyScale['800'],
  },
  feed: {
    gap: spacing.l,
  },
  message: {
    alignItems: 'center',
    gap: spacing.l,
    paddingVertical: spacing['4xl'],
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: spacing['4xl'],
  },
  skeleton: {
    backgroundColor: colors.greyScale['100'],
    borderRadius: spacing.m,
  },
  skeletonImpact: {
    flex: 1,
  },
  skeletonCard: {
    height: 350,
  },
  deleteAccount: {
    alignSelf: 'center',
    marginTop: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
  },
  deleteAccountText: {
    color: colors.red['700'],
  },
});
