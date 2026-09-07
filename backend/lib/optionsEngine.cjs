/**
 * Moteur d'options produits — format unifié menu / POS / dashboard.
 *
 * Groupe :
 * {
 *   id, name,
 *   selection: 'single' | 'multiple',
 *   required: boolean,
 *   min: number, max: number,
 *   choices: [{ id, label, priceDelta }]  // priceDelta en euros
 * }
 *
 * Sélection : { [groupId]: string | string[] }  // ids de choix
 * Snapshot ligne : [{ groupId, groupName, choiceId, label, priceDelta }]
 */

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'opt';
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeChoice(raw, index = 0) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const label = raw.trim();
    if (!label) return null;
    return { id: slugify(label) || `c${index}`, label, priceDelta: 0 };
  }
  if (typeof raw !== 'object') return null;
  const label = String(raw.label || raw.name || raw.value || '').trim();
  if (!label) return null;
  const id = String(raw.id || slugify(label) || `c${index}`).trim();
  return {
    id,
    label,
    priceDelta: Math.round(asNumber(raw.priceDelta ?? raw.price_delta ?? raw.extra ?? 0) * 100) / 100,
  };
}

function normalizeGroup(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || raw.label || '').trim();
  if (!name) return null;

  const choicesRaw = Array.isArray(raw.choices) ? raw.choices : [];
  const choices = choicesRaw
    .map((c, i) => normalizeChoice(c, i))
    .filter(Boolean);

  // Dédupliquer ids
  const seen = new Set();
  const uniqueChoices = [];
  for (const c of choices) {
    let id = c.id;
    let n = 1;
    while (seen.has(id)) {
      id = `${c.id}-${n++}`;
    }
    seen.add(id);
    uniqueChoices.push({ ...c, id });
  }
  if (!uniqueChoices.length) return null;

  const selection = raw.selection === 'multiple' || raw.type === 'multiple' || raw.multi
    ? 'multiple'
    : 'single';

  const required = raw.required == null
    ? selection === 'single'
    : !!raw.required;

  let min = asNumber(raw.min, required ? 1 : 0);
  // max null/undefined/'' => illimité (null) pour multiple ; single reste 1
  const maxRaw = raw.max;
  const unlimited =
    selection === 'multiple' &&
    (maxRaw === null || maxRaw === undefined || maxRaw === '' || String(maxRaw).toLowerCase() === 'null');
  let max = unlimited
    ? null
    : asNumber(maxRaw, selection === 'single' ? 1 : uniqueChoices.length);

  if (selection === 'single') {
    max = 1;
    if (required) min = Math.max(min, 1);
  }
  min = Math.max(0, Math.min(min, uniqueChoices.length));
  if (max != null) {
    max = Math.max(min, Math.min(max, uniqueChoices.length));
  }

  const id = String(raw.id || slugify(name) || `g${index}`).trim();

  return {
    id,
    name,
    selection,
    required,
    min,
    max,
    choices: uniqueChoices,
    choicesLabels: uniqueChoices.map((c) => c.label),
  };
}

function normalizeOptionsSchema(raw) {
  if (raw == null || raw === '') return null;
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(value)) return null;

  const groups = value
    .map((g, i) => normalizeGroup(g, i))
    .filter(Boolean);

  // Dédup ids de groupes
  const seen = new Set();
  const unique = [];
  for (const g of groups) {
    let id = g.id;
    let n = 1;
    while (seen.has(id)) id = `${g.id}-${n++}`;
    seen.add(id);
    unique.push({ ...g, id });
  }
  return unique.length ? unique : null;
}

function getSelectedIds(selection, groupId) {
  if (!selection || typeof selection !== 'object') return [];
  const raw = selection[groupId];
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string' && raw) return [raw];
  return [];
}

function emptySelection(schema) {
  const sel = {};
  for (const group of schema || []) {
    if (group.selection === 'single' && group.required && group.choices[0]) {
      sel[group.id] = group.choices[0].id;
    } else if (group.selection === 'multiple') {
      sel[group.id] = [];
    } else {
      sel[group.id] = group.required && group.choices[0] ? group.choices[0].id : '';
    }
  }
  return sel;
}

function validateSelection(schema, selection) {
  const groups = normalizeOptionsSchema(schema) || [];
  const errors = [];

  for (const group of groups) {
    const ids = getSelectedIds(selection, group.id);
    const validIds = new Set(group.choices.map((c) => c.id));
    const filtered = ids.filter((id) => validIds.has(id));

    if (filtered.length < group.min) {
      errors.push({
        groupId: group.id,
        message: `« ${group.name} » : minimum ${group.min} choix`,
      });
    }
    if (filtered.length > group.max && group.max != null) {
      errors.push({
        groupId: group.id,
        message: `« ${group.name} » : maximum ${group.max} choix`,
        code: 'MAX',
      });
    }
    if (group.required && filtered.length === 0) {
      errors.push({
        groupId: group.id,
        message: `« ${group.name} » est obligatoire`,
      });
    }
  }

  return { ok: errors.length === 0, errors };
}

function computeOptionsExtraEuros(schema, selection) {
  const groups = normalizeOptionsSchema(schema) || [];
  let extra = 0;
  for (const group of groups) {
    const ids = new Set(getSelectedIds(selection, group.id));
    for (const choice of group.choices) {
      if (ids.has(choice.id)) extra += choice.priceDelta;
    }
  }
  return Math.round(extra * 100) / 100;
}

function computeUnitPriceEuros(basePrice, schema, selection) {
  const base = asNumber(basePrice, 0);
  return Math.round((base + computeOptionsExtraEuros(schema, selection)) * 100) / 100;
}

function buildOptionsSnapshot(schema, selection) {
  const groups = normalizeOptionsSchema(schema) || [];
  const snapshot = [];
  for (const group of groups) {
    const ids = getSelectedIds(selection, group.id);
    for (const id of ids) {
      const choice = group.choices.find((c) => c.id === id);
      if (!choice) continue;
      snapshot.push({
        groupId: group.id,
        groupName: group.name,
        choiceId: choice.id,
        label: choice.label,
        priceDelta: choice.priceDelta,
      });
    }
  }
  return snapshot;
}

/** Affichage compact : "Taille: Large · Suppléments: bacon, fromage" */
function formatOptionsLabel(snapshotOrSelection, schema) {
  if (Array.isArray(snapshotOrSelection)) {
    const byGroup = {};
    for (const row of snapshotOrSelection) {
      const key = row.groupName || row.groupId || 'Options';
      if (!byGroup[key]) byGroup[key] = [];
      byGroup[key].push(row.label);
    }
    return Object.entries(byGroup)
      .map(([g, labels]) => `${g}: ${labels.join(', ')}`)
      .join(' · ');
  }

  const groups = normalizeOptionsSchema(schema) || [];
  const parts = [];
  for (const group of groups) {
    const ids = getSelectedIds(snapshotOrSelection, group.id);
    const labels = ids
      .map((id) => group.choices.find((c) => c.id === id)?.label)
      .filter(Boolean);
    if (labels.length) parts.push(`${group.name}: ${labels.join(', ')}`);
  }
  return parts.join(' · ');
}

/** Pour édition dashboard : convertir vers forme éditable */
function schemaToEditorRows(schema) {
  return (normalizeOptionsSchema(schema) || []).map((g) => ({
    id: g.id,
    name: g.name,
    selection: g.selection,
    required: g.required,
    min: g.min,
    max: g.max,
    choicesText: g.choices
      .map((c) => (c.priceDelta ? `${c.label}=${c.priceDelta}` : c.label))
      .join(', '),
  }));
}

/**
 * Parse "fromage=1, bacon=1.5, sans oignon" → choices
 */
function parseChoicesText(text) {
  return String(text || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, i) => {
      const eq = part.lastIndexOf('=');
      if (eq > 0) {
        const label = part.slice(0, eq).trim();
        const priceDelta = asNumber(part.slice(eq + 1), 0);
        return normalizeChoice({ label, priceDelta }, i);
      }
      return normalizeChoice(part, i);
    })
    .filter(Boolean);
}

function editorRowsToSchema(rows) {
  const raw = (rows || []).map((row, i) => ({
    id: row.id || undefined,
    name: row.name,
    selection: row.selection === 'multiple' ? 'multiple' : 'single',
    required: !!row.required,
    min: row.min,
    max: row.max,
    choices: parseChoicesText(row.choicesText),
  }));
  return normalizeOptionsSchema(raw);
}

module.exports = {
  slugify,
  normalizeOptionsSchema,
  normalizeGroup,
  normalizeChoice,
  emptySelection,
  validateSelection,
  computeOptionsExtraEuros,
  computeUnitPriceEuros,
  buildOptionsSnapshot,
  formatOptionsLabel,
  schemaToEditorRows,
  parseChoicesText,
  editorRowsToSchema,
  getSelectedIds,
};
