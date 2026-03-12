const prisma = require('../config/database');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');

exports.getProducts = async (req, res, next) => {
  try {
    const { restaurantId, categoryId, isGlobal, includeGlobal, search, paginate } = req.query;
    const where = { isDeleted: false };

    if (isGlobal === 'true') {
      where.isGlobal = true;
    } else if (restaurantId) {
      if (includeGlobal === 'true') {
        where.OR = [{ isGlobal: true }, { restaurantId }];
      } else {
        where.isGlobal = false;
        where.restaurantId = restaurantId;
      }
    }

    if (categoryId) where.categoryId = categoryId;

    if (search) {
      where.OR = where.OR || [];
      where.OR.push(
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      );
    }

    let paginationOptions = {};
    if (paginate === 'true') {
      const parsed = parsePaginationParams(req.query);
      paginationOptions = { skip: parsed.skip, take: parsed.limit, page: parsed.page, limit: parsed.limit };
    }

    const queryOptions = {
      where,
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { stocks: true } },
      },
      orderBy: { order: 'asc' },
    };

    if (paginate === 'true') {
      queryOptions.skip = paginationOptions.skip;
      queryOptions.take = paginationOptions.take;
      const totalCount = await prisma.product.count({ where });
      const products = await prisma.product.findMany(queryOptions);
      return res.json(createPaginatedResponse(products, totalCount, { page: paginationOptions.page, limit: paginationOptions.limit }));
    }

    const products = await prisma.product.findMany(queryOptions);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id, isDeleted: false },
      include: {
        category: true,
        stocks: {
          where: { isDeleted: false },
          include: {
            restaurant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, image, basePrice, categoryId, isGlobal, restaurantId } = req.body;

    if (isGlobal && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Global ürün oluşturmak için admin yetkisi gerekli' });
    }

    if (!isGlobal && restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
      if (!restaurant || restaurant.ownerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Bu restoran için ürün oluşturma yetkiniz yok' });
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        image,
        basePrice,
        categoryId,
        isGlobal: isGlobal || false,
        restaurantId: isGlobal ? null : restaurantId,
      },
      include: { category: true },
    });

    res.status(201).json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image, basePrice, categoryId, isActive } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id, isDeleted: false },
      include: { restaurant: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
    }

    if (existing.isGlobal && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Global ürünü güncellemek için admin yetkisi gerekli' });
    }

    if (!existing.isGlobal && existing.restaurant?.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu ürünü güncelleme yetkiniz yok' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isActive !== undefined) updateData.isActive = isActive;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    res.json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({
      where: { id, isDeleted: false },
      include: { restaurant: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
    }

    if (existing.isGlobal && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Global ürünü silmek için admin yetkisi gerekli' });
    }

    if (!existing.isGlobal && existing.restaurant?.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu ürünü silme yetkiniz yok' });
    }

    await prisma.product.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    res.json({ success: true, message: 'Ürün başarıyla silindi' });
  } catch (error) {
    next(error);
  }
};

exports.copyGlobalProducts = async (req, res, next) => {
  try {
    const { restaurantId } = req.body;
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });

    if (!restaurant || restaurant.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu restoran için işlem yapma yetkiniz yok' });
    }

    const globalProducts = await prisma.product.findMany({
      where: { isGlobal: true, isDeleted: false },
    });

    const copiedProducts = await Promise.all(
      globalProducts.map((product) =>
        prisma.product.create({
          data: {
            name: product.name,
            description: product.description,
            image: product.image,
            basePrice: product.basePrice,
            categoryId: product.categoryId,
            isGlobal: false,
            restaurantId,
          },
        })
      )
    );

    res.json({
      success: true,
      message: 'Global ürünler başarıyla kopyalandı',
      data: copiedProducts,
    });
  } catch (error) {
    next(error);
  }
};

exports.reorderProducts = async (req, res, next) => {
  try {
    const { productOrders } = req.body;
    if (!Array.isArray(productOrders) || productOrders.length === 0) {
      return res.status(400).json({ success: false, message: 'Geçersiz sıralama verisi' });
    }

    await Promise.all(
      productOrders.map(({ id, order }) =>
        prisma.product.update({
          where: { id },
          data: { order },
        })
      )
    );

    res.json({ success: true, message: 'Ürün sıralaması güncellendi' });
  } catch (error) {
    next(error);
  }
};
