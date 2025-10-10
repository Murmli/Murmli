const { mergeItemArrays } = require('../utils/shoppingListUtils');

describe('mergeItemArrays', () => {
  test('merges manual items even when recipe flag is missing', () => {
    const existing = [
      { name: 'Wasser', quantity: 1, unit: 3, category: 2, recipe: false, active: true }
    ];
    const newItems = [
      { name: 'Wasser', quantity: 1, unit: 3, category: 2, active: true }
    ];

    const result = mergeItemArrays(existing, newItems);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(2);
  });

  test('merges items with identical names and units regardless of casing', () => {
    const existing = [
      { name: 'käse', quantity: 100, unit: '0', category: 5, recipe: false, active: true }
    ];
    const newItems = [
      { name: 'Käse', quantity: '200', unit: '0', category: 5 }
    ];

    const result = mergeItemArrays(existing, newItems);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(300);
  });
});
