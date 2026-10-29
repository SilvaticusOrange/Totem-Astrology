import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CitySuggestionModal } from './CitySuggestionModal';
import {
  formatPlaceLabel,
  normalizePlace,
  searchCities,
} from '../lib/birth';
import { useLocale } from '../lib/LocaleContext';
import { COLORS, RELATIONSHIP_TAGS } from '../theme';
import type { BirthPlace, RelationshipTag } from '../types';

export type BirthFormValues = {
  name: string;
  birthDate: string;
  birthTime: string;
  cityQuery: string;
  birthPlace: BirthPlace | null;
  relationship: RelationshipTag;
  notes: string;
};

type Props = {
  title: string;
  submitLabel: string;
  values: BirthFormValues;
  showRelationship?: boolean;
  onChange: (values: BirthFormValues) => void;
  onSubmit: () => void;
  error?: string | null;
  loading?: boolean;
};

const RELATIONSHIP_KEYS: Record<(typeof RELATIONSHIP_TAGS)[number], string> = {
  Partner: 'circle.relationship.partner',
  Family: 'circle.relationship.family',
  Friend: 'circle.relationship.friend',
  Coworker: 'circle.relationship.coworker',
  Other: 'circle.relationship.other',
};

export function BirthProfileForm({
  title,
  submitLabel,
  values,
  showRelationship = false,
  onChange,
  onSubmit,
  error,
  loading,
}: Props) {
  const { t } = useLocale();
  const inputRef = useRef<TextInput>(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const searchVersion = useRef(0);
  const userEdited = useRef(false);
  const chosenQuery = useRef<string | null>(null);
  const queryRef = useRef(values.cityQuery);
  const menuRef = useRef<BirthPlace[]>([]);
  const [menu, setMenu] = useState<BirthPlace[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  menuRef.current = menu;

  const chooseCity = (place: BirthPlace) => {
    const label = formatPlaceLabel(place);
    chosenQuery.current = label;
    queryRef.current = label;
    userEdited.current = false;
    searchVersion.current += 1;
    setMenu([]);
    setCityLoading(false);
    inputRef.current?.setNativeProps({ text: label });
    onChange({
      ...valuesRef.current,
      birthPlace: place,
      cityQuery: label,
    });
  };

  useEffect(() => {
    const query = values.cityQuery.trim();
    if (!userEdited.current || chosenQuery.current === query || query.length < 2) {
      return;
    }

    const version = searchVersion.current + 1;
    searchVersion.current = version;
    const timer = setTimeout(async () => {
      setCityLoading(true);
      try {
        const raw = await searchCities(query);
        if (searchVersion.current !== version) return;
        const places = raw.map(normalizePlace).filter((place) => place.timezone);
        if (places.length > 0) setMenu(places);
      } catch {
        /* Keep the list that is already open. */
      } finally {
        if (searchVersion.current === version) setCityLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [values.cityQuery]);

  const patch = (partial: Partial<BirthFormValues>) =>
    onChange({ ...valuesRef.current, ...partial });

  const body = (
    <>
      <Text style={styles.title}>{title}</Text>

      <Field label={t('form.name')}>
        <TextInput
          style={styles.input}
          value={values.name}
          onChangeText={(name) => patch({ name })}
          placeholder={t('form.placeholder.name')}
          placeholderTextColor={COLORS.dim}
        />
      </Field>

      <Field label={t('form.birthDate')}>
        <TextInput
          style={styles.input}
          value={values.birthDate}
          onChangeText={(birthDate) => patch({ birthDate })}
          placeholder={t('form.placeholder.birthDate')}
          placeholderTextColor={COLORS.dim}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />
        <Text style={styles.hint}>{t('form.hint.birthDate')}</Text>
      </Field>

      <Field label={t('form.birthTime')}>
        <TextInput
          style={styles.input}
          value={values.birthTime}
          onChangeText={(birthTime) => patch({ birthTime })}
          placeholder={t('form.placeholder.birthTime')}
          placeholderTextColor={COLORS.dim}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />
        <Text style={styles.hint}>{t('form.hint.birthTime')}</Text>
      </Field>

      <Field label={t('form.birthCity')}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          defaultValue={values.cityQuery}
          onChangeText={(cityQuery) => {
            const current = queryRef.current;
            // Opening the list makes iOS wipe the field in one step.
            // A real delete removes a single character.
            if (cityQuery.length + 1 < current.length) {
              inputRef.current?.setNativeProps({ text: current });
              return;
            }
            if (cityQuery === current) return;
            queryRef.current = cityQuery;
            userEdited.current = true;
            chosenQuery.current = null;
            patch({ cityQuery, birthPlace: null });
          }}
          placeholder={t('form.placeholder.birthCity')}
          placeholderTextColor={COLORS.dim}
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          textContentType="none"
        />
        {cityLoading ? <Text style={styles.hint}>{t('common.searchingCities')}</Text> : null}
      </Field>
      <CitySuggestionModal
        items={menu.map((place, index) => ({
          key: `${place.name}-${place.admin1 ?? ''}-${place.country}-${place.timezone}-${index}`,
          label: formatPlaceLabel(place),
        }))}
        onSelect={(index) => {
          const place = menuRef.current[index];
          if (place) chooseCity(place);
        }}
      />

      {showRelationship ? (
        <Field label={t('form.relationship')}>
          <View style={styles.chipRow}>
            {RELATIONSHIP_TAGS.map((relationship) => (
              <Pressable
                key={relationship}
                style={[styles.chip, values.relationship === relationship && styles.chipActive]}
                onPress={() => patch({ relationship })}
              >
                <Text
                  style={[
                    styles.chipText,
                    values.relationship === relationship && styles.chipTextActive,
                  ]}
                >
                  {t(RELATIONSHIP_KEYS[relationship])}
                </Text>
              </Pressable>
            ))}
          </View>
        </Field>
      ) : null}

      {showRelationship ? (
        <Field label={t('form.notesOptional')}>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={values.notes}
            onChangeText={(notes) => patch({ notes })}
            placeholder={t('form.placeholder.notes')}
            placeholderTextColor={COLORS.dim}
            multiline
          />
        </Field>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.submit} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.bg} />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </Pressable>
    </>
  );

  return <View style={styles.container}>{body}</View>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  field: {
    gap: 8,
  },
  label: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    color: COLORS.dim,
    fontSize: 13,
  },
  suggestions: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestion: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  suggestionText: {
    color: COLORS.text,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
  },
  chipActive: {
    borderColor: COLORS.gold,
    backgroundColor: '#1f1a12',
  },
  chipText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.gold,
  },
  error: {
    color: COLORS.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  submit: {
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
});
