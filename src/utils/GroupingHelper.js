/**
 * Utility for Odoo-style data grouping.
 * Transforms a flat array into a grouped object with metadata.
 */
export const groupData = (data, groupKey) => {
  if (!groupKey || !data) return { isGrouped: false, groups: [] };

  const groups = data.reduce((acc, item) => {
    const value = item[groupKey] || 'Non défini';
    if (!acc[value]) {
      acc[value] = {
        label: value,
        count: 0,
        items: [],
        totalValue: 0 // Optional: can be used for financial totaling
      };
    }
    acc[value].items.push(item);
    acc[value].count += 1;
    if (item.montant || item.salaire || item.valeur) {
      acc[value].totalValue += (parseFloat(item.montant || item.salaire || item.valeur) || 0);
    }
    return acc;
  }, {});

  return {
    isGrouped: true,
    groupField: groupKey,
    groups: Object.values(groups).sort((a, b) => b.count - a.count)
  };
};
