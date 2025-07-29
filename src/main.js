/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(item, product) {
  // @TODO: Расчет выручки от операции  "sale_price" - "purchase_price" ст-ть закупки - с-ить продажи
  const discount = 1 - item.discount / 100
  return item.sale_price * item.quantity * discount
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  let bonus = 0

  if (index === 0) {
    bonus = 0.15
  } else if (index <= 2) {
    bonus = 0.1
  } else if (index < total - 1) {
    bonus = 0.05
  } else {
    bonus = 0
  }

  return seller.profit * bonus
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0) {
    throw new Error("Некорректные входные данные")
  }
   if (!data || !Array.isArray(data.customers) || data.customers.length === 0) {
    throw new Error("Некорректные входные данные")
  }
  if (!data || !Array.isArray(data.products) || data.products.length === 0) {
    throw new Error("Некорректные входные данные")
  }
  if (!data || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
    throw new Error("Некорректные входные данные")
  }
  // @TODO: Проверка наличия опций
  if (
    !options.calculateRevenue ||
    !options.calculateBonus ||
    typeof options.calculateRevenue !== "function" ||
    typeof options.calculateBonus !== "function"
  ) {
    throw new Error(
      "В options отсутствуют/некорректы функции calculateRevenue и/или calculateBonus"
    )
  }
  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }))

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const productIndex = Object.fromEntries(
    data.products.map((item) => [item.sku, item])
  )
  const sellerIndex = Object.fromEntries(
    sellerStats.map((item) => [item.id, item])
  )
  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id]
    seller.sales_count = seller.sales_count + 1 // Увеличить количество продаж
    seller.revenue = seller.revenue + record.total_amount // Увеличить общую сумму всех продаж
    // Расчёт прибыли для каждого товара
    record.items.forEach((item) => {
      const product = productIndex[item.sku]
      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      let cost = product.purchase_price * item.quantity
      let profit = calculateSimpleRevenue(item, product) - cost
      seller.profit += profit
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0
      }
      seller.products_sold[item.sku] += 1
    })
  })
  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit)
  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    const total = sellerStats.length
    seller.bonus = calculateBonusByProfit(index, total, seller)
    // Формируем топ-10 товаров
    seller.top_products = Object.entries(seller.products_sold)
      // .sort((a, b) => b[1] - a[1])
      // .slice(0, 10)
      // .map(([sku, quantity]) => ({
      //   sku: sku,
      //   quantity: quantity,
      // }))
      .map(([sku, quantity]) => ({ sku, quantity })) // 
        .sort((a, b) => b.quantity - a.quantity) // 
        .slice(0, 10); // 
      // console.log(seller.top_products )
  })
  // @TODO: Подготовка итоговой коллекции с нужными полями

  return sellerStats.map((seller) => ({
    seller_id: seller.id, // Строка, идентификатор продавца
    name: seller.name, // Строка, имя продавца
    revenue: parseFloat(seller.revenue.toFixed(2)), // Число с двумя знаками после точки, выручка продавца
    profit: parseFloat(seller.profit.toFixed(2)), // Число с двумя знаками после точки, прибыль продавца
    sales_count: seller.sales_count, // Целое число, количество продаж продавца
    top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
    bonus: parseFloat(seller.bonus.toFixed(2)), // Число с двумя знаками после точки, бонус продавца
  }))
}
