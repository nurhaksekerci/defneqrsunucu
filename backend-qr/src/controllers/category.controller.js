const prisma = require('../config/database');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');

exports.getCategories = async (req, res, next) => {
  try {
    const { restaurantId, isGlobal, includeGlobal, search, paginate } = req.query;
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
      include: { _count: { select: { products: true } } },
      orderBy: { order: 'asc' },
    };

    if (paginate === 'true') {
      queryOptions.skip = paginationOptions.skip;
      queryOptions.take = paginationOptions.take;
      const totalCount = await prisma.category.count({ where });
      const categories = await prisma.category.findMany(queryOptions);
      return res.json(createPaginatedResponse(categories, totalCount, { page: paginationOptions.page, limit: paginationOptions.limit }));
    }

    const categories = await prisma.category.findMany(queryOptions);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, image, images, order, isGlobal, restaurantId } = req.body;

    if (isGlobal && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Global kategori oluşturmak için admin yetkisi gerekli' });
    }

    if (!isGlobal && restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });
      if (!restaurant || restaurant.ownerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Bu restoran için kategori oluşturma yetkiniz yok' });
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        image,
        images: Array.isArray(images) ? images : undefined,
        order: order || 0,
        isGlobal: isGlobal || false,
        restaurantId: isGlobal ? null : restaurantId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image, images, order } = req.body;

    const existing = await prisma.category.findUnique({
      where: { id, isDeleted: false },
      include: { restaurant: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori bulunamadı' });
    }

    if (existing.isGlobal && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Global kategoriyi güncellemek için admin yetkisi gerekli' });
    }

    if (!existing.isGlobal && existing.restaurant?.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu kategoriyi güncelleme yetkiniz yok' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (images !== undefined) updateData.images = Array.isArray(images) ? images : null;
    if (order !== undefined) updateData.order = order;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Kategori başarıyla güncellendi',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({
      where: { id, isDeleted: false },
      include: {
        restaurant: true,
        _count: { select: { products: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori bulunamadı' });
    }

    if (existing.isGlobal && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Global kategoriyi silmek için admin yetkisi gerekli' });
    }

    if (!existing.isGlobal && existing.restaurant?.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu kategoriyi silme yetkiniz yok' });
    }

    if (existing._count.products > 0) {
      await prisma.product.updateMany({
        where: { categoryId: id, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    }

    await prisma.category.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    res.json({
      success: true,
      message: existing._count.products > 0 ? `Kategori ve ${existing._count.products} ürün başarıyla silindi` : 'Kategori başarıyla silindi',
    });
  } catch (error) {
    next(error);
  }
};

exports.copyGlobalCategoryWithProducts = async (req, res, next) => {
  try {
    const { categoryId, restaurantId, productPrices, productActiveStates } = req.body;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant || restaurant.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu restoran için işlem yapma yetkiniz yok' });
    }

    const globalCategory = await prisma.category.findUnique({
      where: { id: categoryId, isDeleted: false, isGlobal: true },
      include: {
        products: { where: { isDeleted: false, isGlobal: true } },
      },
    });

    if (!globalCategory) {
      return res.status(404).json({ success: false, message: 'Global kategori bulunamadı' });
    }

    const copiedCategory = await prisma.category.create({
      data: {
        name: globalCategory.name,
        description: globalCategory.description,
        image: globalCategory.image,
        images: Array.isArray(globalCategory.images) ? globalCategory.images : undefined,
        order: globalCategory.order,
        isGlobal: false,
        restaurantId,
      },
    });

    const copiedProducts = await Promise.all(
      globalCategory.products.map((product) => {
        const isActive = productActiveStates?.[product.id] !== false;
        const price = isActive ? (productPrices?.[product.id] || 0) : 0;
        return prisma.product.create({
          data: {
            name: product.name,
            description: product.description,
            image: product.image,
            basePrice: price,
            isGlobal: false,
            isActive,
            restaurantId,
            categoryId: copiedCategory.id,
          },
        });
      })
    );

    res.json({
      success: true,
      message: `Kategori ve ${copiedProducts.length} ürün başarıyla kopyalandı`,
      data: { category: copiedCategory, products: copiedProducts },
    });
  } catch (error) {
    next(error);
  }
};

exports.copyGlobalCategories = async (req, res, next) => {
  try {
    const { restaurantId } = req.body;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant || restaurant.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu restoran için işlem yapma yetkiniz yok' });
    }

    const globalCategories = await prisma.category.findMany({
      where: { isGlobal: true, isDeleted: false },
    });

    const copiedCategories = await Promise.all(
      globalCategories.map((cat) =>
        prisma.category.create({
          data: {
            name: cat.name,
            description: cat.description,
            image: cat.image,
            images: Array.isArray(cat.images) ? cat.images : undefined,
            order: cat.order,
            isGlobal: false,
            restaurantId,
          },
        })
      )
    );

    res.json({
      success: true,
      message: 'Global kategoriler başarıyla kopyalandı',
      data: copiedCategories,
    });
  } catch (error) {
    next(error);
  }
};

exports.reorderCategories = async (req, res, next) => {
  try {
    const { categoryOrders } = req.body;
    if (!Array.isArray(categoryOrders) || categoryOrders.length === 0) {
      return res.status(400).json({ success: false, message: 'Geçersiz sıralama verisi' });
    }

    await Promise.all(
      categoryOrders.map(({ id, order }) =>
        prisma.category.update({
          where: { id },
          data: { order },
        })
      )
    );

    res.json({ success: true, message: 'Kategori sıralaması güncellendi' });
  } catch (error) {
    next(error);
  }
};
