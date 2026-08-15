/** Helpers partagés pour le catalogue produits */

function parseCategories(productOrRaw) {
  if (Array.isArray(productOrRaw)) {
    return normalizeCategoryList(productOrRaw);
  }
  if (!productOrRaw || typeof productOrRaw !== 'object') {
    return ['Autres'];
  }
  if (Array.isArray(productOrRaw.categories) && productOrRaw.categories.length) {
    return normalizeCategoryList(productOrRaw.categories);
  }
  if (typeof productOrRaw.categories === 'string') {
    try {
      const parsed = JSON.parse(productOrRaw.categories);
      if (Array.isArray(parsed) && parsed.length) return normalizeCategoryList(parsed);
    } catch {
      /* ignore */
    }
  }
  const legacy = productOrRaw.category ? String(productOrRaw.category).trim() : '';
  return legacy ? [legacy] : ['Autres'];
}

function normalizeCategoryList(list) {
  const cleaned = [...new Set(
    (Array.isArray(list) ? list : [])
      .map((c) => String(c || '').trim())
      .filter(Boolean)
  )];
  return cleaned.length ? cleaned : ['Autres'];
}

function categoriesFromBody(body, fallbackProduct) {
  if (Array.isArray(body?.categories) && body.categories.length) {
    return normalizeCategoryList(body.categories);
  }
  if (body?.category != null && String(body.category).trim()) {
    return normalizeCategoryList([body.category]);
  }
  if (fallbackProduct) return parseCategories(fallbackProduct);
  return ['Autres'];
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
  const opts = value
    .map((opt) => ({
      name: String(opt?.name || '').trim(),
      choices: Array.isArray(opt?.choices)
        ? [...new Set(opt.choices.map((c) => String(c || '').trim()).filter(Boolean))]
        : [],
    }))
    .filter((o) => o.name && o.choices.length);
  return opts.length ? opts : null;
}

function parseOptionsSchema(raw) {
  return normalizeOptionsSchema(raw);
}

function productUsesCategory(product, categoryName) {
  return parseCategories(product).some(
    (c) => c.toLowerCase() === String(categoryName || '').toLowerCase()
  );
}

function renameCategoryInList(categories, oldName, newName) {
  return normalizeCategoryList(
    categories.map((c) => (c === oldName ? newName : c))
  );
}

module.exports = {
  parseCategories,
  normalizeCategoryList,
  categoriesFromBody,
  normalizeOptionsSchema,
  parseOptionsSchema,
  productUsesCategory,
  renameCategoryInList,
};
