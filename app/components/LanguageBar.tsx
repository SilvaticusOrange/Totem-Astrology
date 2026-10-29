import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LOCALES, getLocaleInfo, t } from '../lib/i18n';
import { COLORS } from '../theme';

type Props = {
  locale: string;
  onChange: (code: string) => void;
};

export function LanguageBar({ locale, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = getLocaleInfo(locale);
  const menuRef = useRef<View>(null);

  useEffect(() => {
    setOpen(false);
  }, [locale]);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${t('lang.label', locale)}: ${current.name}`}
        onPress={() => setOpen((value) => !value)}
        style={[styles.toggle, open && styles.toggleOpen]}
      >
        <Text style={styles.emoji}>{current.flag}</Text>
        <Text style={styles.toggleCode}>{current.code.toUpperCase()}</Text>
        <Text style={styles.toggleName} numberOfLines={1}>
          {current.nativeName}
        </Text>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>▾</Text>
      </Pressable>

      {open ? (
        <View ref={menuRef} style={styles.menu}>
          <Text style={styles.label}>{t('lang.label', locale)}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flags}
          >
            {LOCALES.map((entry) => {
              const active = entry.code === locale;
              return (
                <Pressable
                  key={entry.code}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={entry.name}
                  onPress={() => {
                    onChange(entry.code);
                    setOpen(false);
                  }}
                  style={[styles.flag, active && styles.flagActive]}
                >
                  <Text style={styles.emoji}>{entry.flag}</Text>
                  <Text style={[styles.code, active && styles.codeActive]}>
                    {entry.code.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 4,
    zIndex: 20,
  },
  toggle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.35)',
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
  },
  toggleOpen: {
    borderColor: COLORS.gold,
  },
  toggleCode: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  toggleName: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 120,
  },
  chevron: {
    color: COLORS.gold,
    fontSize: 12,
    marginLeft: 2,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  menu: {
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  label: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  flags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  flag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: COLORS.bg,
  },
  flagActive: {
    borderColor: COLORS.gold,
    backgroundColor: '#1f1a12',
  },
  emoji: {
    fontSize: 16,
  },
  code: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  codeActive: {
    color: COLORS.gold,
  },
});
