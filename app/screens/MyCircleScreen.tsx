import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { compareProfiles } from '../../js/totem-match.js';
import { TotemPoleStrip } from '../components/ProfileSummary';
import type { TotemCardDetail } from '../components/TotemDetailModal';
import { BirthProfileForm, type BirthFormValues } from '../components/BirthProfileForm';
import { KeyboardAwareScrollScreen } from '../components/KeyboardAwareScrollScreen';
import {
  calculateProfile,
  defaultBirthForm,
  parseBirthDate,
  parseBirthTime,
} from '../lib/birth';
import { useLocale } from '../lib/LocaleContext';
import type { CirclePerson, MeProfile, RelationshipTag } from '../types';
import { COLORS } from '../theme';

type Props = {
  me: MeProfile | null;
  circle: CirclePerson[];
  onAddPerson: (person: CirclePerson) => void;
  onRemovePerson: (id: string) => void;
  onCompare: (person: CirclePerson) => void;
  onSetupTotem: () => void;
  onOpenTotem: (detail: TotemCardDetail) => void;
};

function newPersonForm(): BirthFormValues {
  return { ...defaultBirthForm(), relationship: 'Friend', notes: '' };
}

function relationshipDisplayKey(tag: RelationshipTag | string) {
  return `circle.relationship.${String(tag).toLowerCase()}`;
}

export function MyCircleScreen({
  me,
  circle,
  onAddPerson,
  onRemovePerson,
  onCompare,
  onSetupTotem,
  onOpenTotem,
}: Props) {
  const { t } = useLocale();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<BirthFormValues>(newPersonForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!me) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>{t('circle.empty.title')}</Text>
        <Text style={styles.emptyText}>{t('circle.empty.body')}</Text>
        <Pressable style={styles.primaryButton} onPress={onSetupTotem}>
          <Text style={styles.primaryButtonText}>{t('circle.empty.cta')}</Text>
        </Pressable>
      </View>
    );
  }

  const handleAdd = () => {
    setError(null);
    const name = form.name.trim();
    if (!name) {
      setError(t('form.error.nameRequired'));
      return;
    }
    const date = parseBirthDate(form.birthDate);
    if (!date) {
      setError(t('form.error.dateInvalid'));
      return;
    }
    const time = parseBirthTime(form.birthTime);
    if (!time) {
      setError(t('form.error.timeInvalid'));
      return;
    }
    if (!form.birthPlace?.timezone) {
      setError(t('form.error.cityRequiredOther'));
      return;
    }

    setLoading(true);
    try {
      const birth = {
        ...date,
        ...time,
        birthPlace: form.birthPlace,
      };
      const profile = calculateProfile(birth);
      const person: CirclePerson = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        relationship: form.relationship,
        birth,
        profile,
        notes: form.notes.trim() || undefined,
      };
      onAddPerson(person);
      setForm(newPersonForm());
      setAdding(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('form.error.calculateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const confirmRemove = (person: CirclePerson) => {
    Alert.alert(
      t('circle.removeConfirm.title', { name: person.name }),
      t('circle.removeConfirm.body'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.remove'), style: 'destructive', onPress: () => onRemovePerson(person.id) },
      ],
    );
  };

  if (adding) {
    return (
      <KeyboardAwareScrollScreen>
        <Pressable onPress={() => setAdding(false)} style={styles.back}>
          <Text style={styles.backText}>{t('circle.cancelBack')}</Text>
        </Pressable>
        <BirthProfileForm
          title={t('circle.formTitle')}
          submitLabel={t('circle.submitSave')}
          values={form}
          showRelationship
          onChange={setForm}
          onSubmit={handleAdd}
          error={error}
          loading={loading}
        />
      </KeyboardAwareScrollScreen>
    );
  }

  return (
    <ScrollView
      style={styles.listScroll}
      contentContainerStyle={styles.wrap}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.lead}>{t('circle.lead')}</Text>

      <Pressable style={styles.primaryButton} onPress={() => setAdding(true)}>
        <Text style={styles.primaryButtonText}>{t('circle.addButton')}</Text>
      </Pressable>

      {circle.length === 0 ? (
        <Text style={styles.emptyList}>{t('circle.emptyList')}</Text>
      ) : (
        <View style={styles.list}>
          {circle.map((person) => {
            const results = compareProfiles(me.profile, person.profile);
            const best = results.reduce(
              (top, entry) => (entry.count > top.count ? entry : top),
              results[0],
            );
            const fullMatches = results.filter((entry) => entry.isFullMatch);
            const bestLabel = t(`match.${best.type}.label`);

            return (
              <View key={person.id} style={styles.personCard}>
                <Pressable style={styles.personMain} onPress={() => onCompare(person)}>
                  <View style={styles.personHeader}>
                    <Text style={styles.personName}>{person.name}</Text>
                    <Text style={styles.personTag}>
                      {t(relationshipDisplayKey(person.relationship))}
                    </Text>
                  </View>
                  <TotemPoleStrip
                    profile={person.profile}
                    onCardPress={({ animal, element, guideLabel }) =>
                      onOpenTotem({ animal, element, guideLabel })
                    }
                  />
                  <Text style={styles.personMatch}>
                    {fullMatches.length
                      ? t('circle.match.full', {
                          labels: fullMatches.map((entry) => t(`match.${entry.type}.label`)).join(', '),
                        })
                      : t('circle.match.strongest', { label: bestLabel, count: best.count })}
                  </Text>
                  <Text style={styles.compareHint}>{t('common.tapToCompare')}</Text>
                </Pressable>
                <Pressable style={styles.removeButton} onPress={() => confirmRemove(person)}>
                  <Text style={styles.removeText}>{t('common.remove')}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listScroll: {
    flex: 1,
  },
  wrap: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  back: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backText: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: '600',
  },
  lead: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  emptyWrap: {
    padding: 20,
    gap: 16,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  emptyList: {
    color: COLORS.dim,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
  list: {
    gap: 12,
  },
  personCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  personMain: {
    padding: 16,
    gap: 6,
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  personName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  personTag: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  personMeta: {
    color: COLORS.muted,
    fontSize: 13,
  },
  personMatch: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
  },
  compareHint: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  removeButton: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  removeText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
