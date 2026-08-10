import type { Area } from './types';

const definitions = [
  {
    code: 'A',
    name: 'Private Vorsorge & AV',
    subjects: [
      'Gesetzliche Rentenversicherung',
      'Private Rentenversicherung',
      'Lebensversicherung',
      'Betriebliche Altersversorgung (bAV)',
    ],
  },
  {
    code: 'B',
    name: 'Kranken- und Unfallversicherung',
    subjects: ['Private Krankenversicherung', 'Pflegeversicherung', 'Unfallversicherung'],
  },
  {
    code: 'C',
    name: 'Rechtliche Grundlagen',
    subjects: [
      'Versicherungsvertragsgesetz (VVG)',
      'Vermittlerrecht',
      'Wettbewerbsrecht',
      'Rechtliche Rahmenbedingungen für die Beratung',
    ],
  },
  {
    code: 'D',
    name: 'Sachversicherungen I',
    subjects: ['Wohngebäudeversicherung', 'Hausratversicherung'],
  },
  {
    code: 'E',
    name: 'Sachversicherungen II & Haftpflicht',
    subjects: ['Haftpflichtversicherung', 'Rechtsschutzversicherung', 'Kraftfahrtversicherung'],
  },
] as const;

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' und ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

export const taxonomy: Area[] = definitions.map((area, areaIndex) => {
  const areaId = `area-${area.code.toLowerCase()}`;
  return {
    id: areaId,
    code: area.code,
    name: area.name,
    sortOrder: areaIndex + 1,
    subjects: area.subjects.map((name, subjectIndex) => ({
      id: `subject-${slugify(name)}`,
      areaId,
      name,
      slug: slugify(name),
      sortOrder: subjectIndex + 1,
      publishedCount: 0,
    })),
  };
});

export const findSubject = (subjectId: string) =>
  taxonomy.flatMap((area) => area.subjects).find((subject) => subject.id === subjectId);

export const findAreaForSubject = (subjectId: string) =>
  taxonomy.find((area) => area.subjects.some((subject) => subject.id === subjectId));
