const flattenOptions = (selectedOptions) => {
  const optList = [];
  Object.values(selectedOptions).forEach((val) => {
    if (Array.isArray(val)) {
      val.forEach((v) => optList.push(v));
    } else if (val) {
      optList.push(val);
    }
  });
  return optList;
};

const calculateTotal = (product, optList, quantity) => {
  const extraPrice = optList.reduce((sum, opt) => sum + (opt.price || 0), 0);
  return (product.price + extraPrice) * quantity;
};

const calculateItemTotal = (item) =>
  item.totalPrice || item.price * (item.quantity || 1);

const calculateOrderTotal = (items) =>
  items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

export {
  flattenOptions,
  calculateTotal,
  calculateItemTotal,
  calculateOrderTotal,
};
