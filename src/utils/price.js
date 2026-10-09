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

export { flattenOptions, calculateTotal };
