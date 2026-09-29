import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  type StyleProp,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from 'react-native';
import MagnifyingGlassIcon from './icons/MagnifyingGlassIcon';
import XCircleIcon from './icons/XCircleIcon';
import { colors, spacing, typography } from '../theme';

export type InputRenderIconProps = { color: string; size: number };

export type InputProps = {
  title?: string;
  required?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  hintText?: string;
  /** Also passed through to the underlying TextInput; when set, shows a "current/max" counter. */
  maxLength?: number;
  /** Defaults to MagnifyingGlassIcon (Figma's own default). Pass `null` for no lead icon. */
  leadIcon?: ((props: InputRenderIconProps) => React.ReactNode) | null;
  /** Called when the clear (×) button is pressed. Defaults to `onChangeText('')`. The button only shows once `value` is non-empty. */
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
} & Pick<
  RNTextInputProps,
  'onFocus' | 'onBlur' | 'secureTextEntry' | 'keyboardType' | 'autoCapitalize' | 'autoCorrect' | 'editable' | 'returnKeyType' | 'onSubmitEditing'
>;

const ICON_SIZE = 20;

/** Text input with title/hint/counter (Figma: Plog Design System, node 335:46). */
export default function Input({
  title,
  required = false,
  value,
  onChangeText,
  placeholder,
  hintText,
  maxLength,
  leadIcon,
  onClear,
  style,
  onFocus,
  onBlur,
  ...textInputProps
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const renderLeadIcon = leadIcon === null ? null : (leadIcon ?? ((p: InputRenderIconProps) => <MagnifyingGlassIcon {...p} />));
  const borderColor = focused ? colors.opacity.black50 : colors.opacity.grey50;
  const valueColor = focused ? colors.greyScale['800'] : colors.greyScale['500'];

  return (
    <View style={style}>
      {title ? (
        <Text style={styles.title}>
          {title}
          {required ? '*' : ''}
        </Text>
      ) : null}
      <View style={[styles.field, { borderColor }]}>
        <View style={styles.inputRow}>
          {renderLeadIcon?.({ color: colors.opacity.grey50, size: ICON_SIZE })}
          <RNTextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.greyScale['500']}
            maxLength={maxLength}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[styles.textInput, { color: valueColor }]}
            {...textInputProps}
          />
        </View>
        {value.length > 0 ? (
          <Pressable onPress={onClear ?? (() => onChangeText(''))} accessibilityRole="button" accessibilityLabel="Clear">
            <XCircleIcon color={colors.opacity.grey50} size={ICON_SIZE} />
          </Pressable>
        ) : null}
      </View>
      {hintText || maxLength ? (
        <View style={styles.hintRow}>
          <Text style={styles.hintText}>{hintText}</Text>
          {maxLength ? (
            <Text style={styles.hintText}>
              {value.length}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: typography.body.extraSmallBold.fontFamily,
    fontWeight: typography.body.extraSmallBold.fontWeight,
    fontSize: typography.body.extraSmallBold.fontSize,
    letterSpacing: typography.body.extraSmallBold.letterSpacing,
    color: colors.greyScale['900'],
    marginBottom: spacing['2xs'],
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.base.white,
    borderWidth: 1,
    borderRadius: spacing.s,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.m,
    gap: spacing.s,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  textInput: {
    flex: 1,
    padding: 0,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: typography.body.small.fontWeight,
    fontSize: typography.body.small.fontSize,
    letterSpacing: typography.body.small.letterSpacing,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing['2xs'],
  },
  hintText: {
    fontFamily: typography.caption.fontFamily,
    fontWeight: typography.caption.fontWeight,
    fontSize: typography.caption.fontSize,
    letterSpacing: typography.caption.letterSpacing,
    color: colors.greyScale['500'],
  },
});
