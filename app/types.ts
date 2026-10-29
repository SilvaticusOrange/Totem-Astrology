import type { RELATIONSHIP_TAGS } from './theme';

export type RelationshipTag = (typeof RELATIONSHIP_TAGS)[number];

export type BirthPlace = {
  name: string;
  admin1?: string;
  country: string;
  timezone: string;
};

export type BirthData = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  birthPlace: BirthPlace;
};

export type TotemProfile = {
  spirit: string;
  mental: string;
  emotional: string;
  physical: string;
  elements?: Partial<Record<'spirit' | 'mental' | 'emotional' | 'physical', string>>;
};

export type MeProfile = {
  name: string;
  birth: BirthData;
  profile: TotemProfile;
};

export type CirclePerson = {
  id: string;
  name: string;
  relationship: RelationshipTag;
  birth: BirthData;
  profile: TotemProfile;
  notes?: string;
};

export type AppData = {
  me: MeProfile | null;
  circle: CirclePerson[];
};

export type MatchTypeId = 'rainbow' | 'shadow' | 'mirror' | 'trine' | 'sameAsMe';
