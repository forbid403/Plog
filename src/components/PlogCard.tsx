import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MySession } from '../api';
import { formatDistanceKm, formatDuration, formatListDate, formatLiters, formatPace } from '../lib/format';
import { colors, spacing, typography } from '../theme';
import BagFillIcon from './BagFillIcon';
import ArrowsOutSimpleIcon from './icons/ArrowsOutSimpleIcon';
import ExportIcon from './icons/ExportIcon';
import RouteMapPreview from './RouteMapPreview';

export type PlogCardProps = {
  session: MySession;
  /** Card / photo / thumbnail tap → session detail. */
  onPress: () => void;
  /** Share icon → this session's Impact card. */
  onShare: () => void;
};

const PHOTO_HEIGHT = 350;
const THUMBNAIL_SIZE = 100;
const STAT_GAP = 26; // Figma 690:1896
const BAG_HEIGHT = 51; // Figma 690:1892 (39 × 51)

/** Recent Plogs session card (G4.2; Figma: Plog Design, node 690:1882). */
export default function PlogCard({ session, onPress, onShare }: PlogCardProps) {
  const photo = session.photoUrls[0];
  const route = session.route;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={session.title} style={styles.card}>
      <View style={styles.photoArea}>
        {photo ? (
          <>
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {route.length > 1 && (
              <View style={styles.thumbnail}>
                <RouteMapPreview points={route} style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, styles.thumbnailShade]} />
                <ArrowsOutSimpleIcon color={colors.base.white} />
              </View>
            )}
          </>
        ) : (
          // G4.2 [Proposed]: no photo → the route map fills the photo area, no thumbnail.
          <RouteMapPreview points={route} style={StyleSheet.absoluteFill} />
        )}
      </View>

      <View style={styles.nameDate}>
        <Text style={styles.title} numberOfLines={1}>
          {session.title}
        </Text>
        <Text style={styles.date}>{formatListDate(session.startedAt, session.timezone)}</Text>
      </View>

      <View style={styles.litter}>
        <BagFillIcon fill={session.fillRatio ?? 0} height={BAG_HEIGHT} />
        <Text style={styles.liters}>{session.liters !== null ? formatLiters(session.liters) : '– L'}</Text>
      </View>

      <View style={styles.numbers}>
        <View style={styles.stats}>
          <Stat value={`${formatDistanceKm(session.distanceKm, 1)} km`} label="Distance" />
          <Stat value={formatDuration(session.durationSec)} label="Time" />
          <Stat value={session.avgPaceSecPerKm !== null ? formatPace(session.avgPaceSecPerKm) : '–'} label="Avg.Pace" />
        </View>
        <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share" hitSlop={spacing.s}>
          <ExportIcon color={colors.greyScale['900']} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const text = (t: { fontFamily: string; fontWeight: string; fontSize: number; letterSpacing: number }) => ({
  fontFamily: t.fontFamily,
  fontWeight: t.fontWeight as '400',
  fontSize: t.fontSize,
  letterSpacing: t.letterSpacing,
});

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.m,
    gap: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyScale['400'],
  },
  photoArea: {
    height: PHOTO_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
    backgroundColor: colors.greyScale['100'],
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: spacing.m,
    overflow: 'hidden',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.m,
  },
  thumbnailShade: {
    // Figma: gradient to 20% black at the bottom so the white icon reads.
    backgroundColor: colors.opacity.black12,
  },
  nameDate: {
    gap: spacing.s,
  },
  title: {
    ...text(typography.titles.medium),
    color: colors.greyScale['800'],
  },
  date: {
    ...text(typography.body.base),
    color: colors.greyScale['600'],
  },
  litter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.l,
  },
  liters: {
    ...text(typography.titles.large),
    color: colors.greyScale['800'],
  },
  numbers: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: spacing.m,
  },
  stats: {
    flexDirection: 'row',
    gap: STAT_GAP,
  },
  statValue: {
    ...text(typography.body.baseBold),
    color: colors.greyScale['800'],
  },
  statLabel: {
    ...text(typography.body.extraSmall),
    color: colors.greyScale['800'],
  },
});
