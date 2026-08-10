import type { ImportPreview, ImportPreviewItem } from './types';
import { importQuestionSchema } from './schemas';
import { taxonomy } from './taxonomy';

const mojibake: Record<string, string> = {
  'Ã¤': 'ä',
  'Ã¶': 'ö',
  'Ã¼': 'ü',
  'Ã„': 'Ä',
  'Ã–': 'Ö',
  'Ãœ': 'Ü',
  'ÃŸ': 'ß',
  'â€“': '–',
  'â€”': '—',
  'â€ž': '„',
  'â€œ': '“',
};

export const normalizeText = (input: string): { value: string; changed: boolean } => {
  let value = input.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  Object.entries(mojibake).forEach(([broken, replacement]) => {
    value = value.split(broken).join(replacement);
  });
  value = value.normalize('NFC').trim();
  return { value, changed: value !== input };
};

const normalizeDeep = (value: unknown, changes: string[], path = ''): unknown => {
  if (typeof value === 'string') {
    const normalized = normalizeText(value);
    if (normalized.changed) changes.push(path || 'Text');
    return normalized.value;
  }
  if (Array.isArray(value)) return value.map((entry, index) => normalizeDeep(entry, changes, `${path}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeDeep(entry, changes, path ? `${path}.${key}` : key)]),
    );
  }
  return value;
};

export const previewQuestionImport = (rawJson: string): ImportPreview => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      valid: false,
      items: [{ index: 0, original: rawJson, normalized: {}, changes: [], warnings: [], errors: [{ field: 'json', message: 'Ungültiges JSON.' }] }],
    };
  }

  const values = Array.isArray(parsed) ? parsed : [parsed];
  const subjects = taxonomy.flatMap((area) => area.subjects);
  const items: ImportPreviewItem[] = values.map((original, index) => {
    const changes: string[] = [];
    const normalizedInput = normalizeDeep(original, changes);
    const result = importQuestionSchema.safeParse(normalizedInput);
    if (!result.success) {
      return {
        index,
        original,
        normalized: {},
        changes,
        warnings: [],
        errors: result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      };
    }
    const subject = subjects.find(
      (candidate) => candidate.name.toLocaleLowerCase('de-DE') === result.data.sparte.toLocaleLowerCase('de-DE'),
    );
    const errors = subject ? [] : [{ field: 'sparte', message: `Unbekannte Sparte: ${result.data.sparte}` }];
    return {
      index,
      original,
      changes,
      warnings: [],
      errors,
      normalized: subject
        ? {
            subjectId: subject.id,
            prompt: result.data.frage,
            answers: result.data.antworten,
            correctIndex: result.data.richtige_antwort,
            explanation: result.data.erklärung,
            status: 'draft' as const,
            version: result.data.version,
            changeSensitive: result.data.änderungsanfällig,
            containsTimeSensitiveNumbers: result.data.contains_time_sensitive_numbers,
            lastReviewedAt: result.data.zuletzt_geprüft_am ?? null,
            nextReviewAt: result.data.nächste_prüfung_am ?? null,
            reviewer: result.data.prüfverantwortlich ?? null,
            source: result.data.quelle
              ? {
                  title: result.data.quelle.titel,
                  url: result.data.quelle.url || null,
                  sourceDate: result.data.quelle.stand || null,
                  notes: null,
                }
              : null,
          }
        : {},
    };
  });

  const promptCounts = new Map<string, number>();
  items.forEach((item) => {
    const prompt = item.normalized.prompt?.toLocaleLowerCase('de-DE');
    if (prompt) promptCounts.set(prompt, (promptCounts.get(prompt) ?? 0) + 1);
  });
  items.forEach((item) => {
    const prompt = item.normalized.prompt?.toLocaleLowerCase('de-DE');
    if (prompt && (promptCounts.get(prompt) ?? 0) > 1) item.warnings.push('Mögliches Duplikat innerhalb des Importbatches.');
  });

  return { items, valid: items.length > 0 && items.every((item) => item.errors.length === 0) };
};
