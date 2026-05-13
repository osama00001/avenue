  function afterDiscountPrice(originalPrice, discountPercent) {
    const discountAmount = (originalPrice * discountPercent) / 100;
    const discountedPrice = originalPrice - discountAmount;
    return discountedPrice.toFixed(2);
  }
  
  export default afterDiscountPrice;