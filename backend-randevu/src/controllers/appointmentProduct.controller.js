const prisma = require('../config/database');
const { Decimal } = require('@prisma/client/runtime/library');

const ensureBusinessAccess = async (userId, businessId) => {
  const business = await prisma.appointmentBusiness.findFirst({
    where: { id: businessId, ownerId: userId, isDeleted: false }
  });
  return business;
};

const toDecimal = (v) => (v != null && v !== '' ? new Decimal(Number(v)) : null);

exports.getProducts = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const products = await prisma.appointmentProduct.findMany({
      where: { businessId, isDeleted: false },
      include: {
        _count: { select: { sales: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { name, sku, price, stockQuantity } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Ürün adı zorunludur' });
    }
    const priceDec = toDecimal(price);
    if (!priceDec || priceDec.lt(0)) {
      return res.status(400).json({ success: false, message: 'Geçerli fiyat girin' });
    }
    const product = await prisma.appointmentProduct.create({
      data: {
        businessId,
        name: name.trim(),
        sku: (sku || '').trim() || null,
        price: priceDec,
        stockQuantity: stockQuantity != null ? parseInt(stockQuantity, 10) : null
      }
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id: businessId, productId } = req.params;
    const { name, sku, price, stockQuantity } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.appointmentProduct.findFirst({
      where: { id: productId, businessId, isDeleted: false }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
    }
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (sku !== undefined) data.sku = (sku || '').trim() || null;
    const priceDec = toDecimal(price);
    if (priceDec !== null && priceDec.gte(0)) data.price = priceDec;
    if (stockQuantity !== undefined) data.stockQuantity = stockQuantity != null ? parseInt(stockQuantity, 10) : null;
    const product = await prisma.appointmentProduct.update({
      where: { id: productId },
      data
    });
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id: businessId, productId } = req.params;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const existing = await prisma.appointmentProduct.findFirst({
      where: { id: productId, businessId, isDeleted: false }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
    }
    await prisma.appointmentProduct.update({
      where: { id: productId },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    res.json({ success: true, message: 'Silindi' });
  } catch (error) {
    next(error);
  }
};

exports.recordSale = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { productId, quantity, unitPrice, customerId, soldAt, notes } = req.body;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const product = await prisma.appointmentProduct.findFirst({
      where: { id: productId, businessId, isDeleted: false }
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
    }
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      return res.status(400).json({ success: false, message: 'Geçerli miktar girin' });
    }
    const up = toDecimal(unitPrice) || product.price;
    const total = up.mul(qty);
    const soldAtDate = soldAt ? new Date(soldAt) : new Date();
    const sale = await prisma.$transaction(async (tx) => {
      const s = await tx.productSale.create({
        data: {
          productId,
          quantity: qty,
          unitPrice: up,
          totalAmount: total,
          customerId: customerId || null,
          soldAt: soldAtDate,
          notes: (notes || '').trim() || null
        }
      });
      if (product.stockQuantity != null) {
        await tx.appointmentProduct.update({
          where: { id: productId },
          data: { stockQuantity: { decrement: qty } }
        });
      }
      await tx.financeEntry.create({
        data: {
          businessId,
          type: 'INCOME',
          amount: total,
          date: soldAtDate,
          category: 'Ürün',
          description: `${product.name} × ${qty}`
        }
      });
      return s;
    });
    const withProduct = await prisma.productSale.findUnique({
      where: { id: sale.id },
      include: { product: true }
    });
    res.status(201).json({ success: true, data: withProduct });
  } catch (error) {
    next(error);
  }
};

exports.getSalesReport = async (req, res, next) => {
  try {
    const { id: businessId } = req.params;
    const { start, end } = req.query;
    const business = await ensureBusinessAccess(req.user.id, businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'İşletme bulunamadı' });
    }
    const now = new Date();
    const startDate = start ? new Date(start) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = end ? new Date(end) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const where = {
      product: { businessId, isDeleted: false },
      soldAt: { gte: startDate, lte: endDate }
    };
    const sales = await prisma.productSale.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } }
      },
      orderBy: { soldAt: 'desc' }
    });
    const byProduct = sales.reduce((acc, s) => {
      const pid = s.productId;
      if (!acc[pid]) {
        acc[pid] = { product: s.product, quantity: 0, totalAmount: 0, sales: [] };
      }
      acc[pid].quantity += s.quantity;
      acc[pid].totalAmount += Number(s.totalAmount);
      acc[pid].sales.push(s);
      return acc;
    }, {});
    const report = Object.values(byProduct).map((r) => ({
      productId: r.product.id,
      productName: r.product.name,
      sku: r.product.sku,
      totalQuantity: r.quantity,
      totalAmount: r.totalAmount,
      saleCount: r.sales.length
    })).sort((a, b) => b.totalAmount - a.totalAmount);
    const grandTotal = report.reduce((s, r) => s + r.totalAmount, 0);
    res.json({
      success: true,
      data: {
        report,
        grandTotal,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        recentSales: sales.slice(0, 20)
      }
    });
  } catch (error) {
    next(error);
  }
};
