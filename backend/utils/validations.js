exports.validateItemArray = (items) => {
  if (!Array.isArray(items)) {
    return false;
  }
  for (let item of items) {
    if (item.quantity !== null) {
      item.quantity = parseFloat(item.quantity);
    }

    if (item.unit !== null) {
      item.unit = parseInt(item.unit, 10);
    } else {
      item.unit = 11;
    }

    item.category = parseInt(item.category, 10);
    if ((item.quantity !== null && isNaN(item.quantity)) || isNaN(item.unit) || isNaN(item.category)) {
      return false;
    }
  }
  return true;
};
