import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BirthProfileForm, type BirthFormValues } from '../components/BirthProfileForm';
import { KeyboardAwareScrollScreen } from '../components/KeyboardAwareScrollScreen';
import { ProfileSummary } from '../components/ProfileSummary';
import type { TotemCardDetail } from '../components/TotemDetailModal';
import {
  calculateProfile,
  defaultBirthForm,
  formatPlaceLabel,
  parseBirthDate,
  parseBirthTime,
} from '../lib/birth';
import { useLocale } from '../lib/LocaleContext';
import type { MeProfile } from '../types';
import { COLORS } from '../theme';

type Props = {
  me: MeProfile | null;
  onSave: (me: MeProfile) => void;
  onOpenTotem: (detail: TotemCardDetail) => void;
};

function meToForm(me: MeProfile | null): BirthFormValues {
  const base = defaultBirthForm();
  if (!me) {
    return { ...base, relationship: 'Other', notes: '' };
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    name: me.name,
    birthDate: `${me.birth.year}-${pad(me.birth.month)}-${pad(me.birth.day)}`,
    birthTime: `${pad(me.birth.hour)}:${pad(me.birth.minute)}`,
    cityQuery: formatPlaceLabel(me.birth.birthPlace),
    birthPlace: me.birth.birthPlace,
    relationship: 'Other',
    notes: '',
  };
}

export function MyTotemScreen({ me, onSave, onOpenTotem }: Props) {
  const { t } = useLocale();
  const [form, setForm] = useState<BirthFormValues>(() => meToForm(me));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedProfile, setSavedProfile] = useState(me?.profile ?? null);

  const headline = me ? t('totem.lead.saved') : t('totem.lead.calculate');

  const handleSubmit = () => {
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
      setError(t('form.error.cityRequiredMe'));
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
      const next: MeProfile = { name, birth, profile };
      setSavedProfile(profile);
      onSave(next);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('form.error.calculateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollScreen contentContainerStyle={styles.scroll}>
      <Text style={styles.lead}>{headline}</Text>
      <Text style={styles.note}>{t('totem.nepalTimeNote')}</Text>

      <BirthProfileForm
        title={t('totem.formTitle')}
        submitLabel={me ? t('totem.submit.update') : t('totem.submit.calculate')}
        values={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
      />

      {savedProfile ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('totem.guidesTitle')}</Text>
          <Text style={styles.cardHint}>{t('totem.guidesHint')}</Text>
          <ProfileSummary
            profile={savedProfile}
            onCardPress={({ animal, element, guideLabel }) =>
              onOpenTotem({ animal, element, guideLabel })
            }
          />
        </View>
      ) : null}
    </KeyboardAwareScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 8,
  },
  lead: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  note: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  cardHint: {
    color: COLORS.dim,
    fontSize: 13,
  },
});
