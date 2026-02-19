const prisma = require('../config/database');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');

// Kategorileri listele
exports.getCategories = async (req, res, next) => {
  try {
    const { restaurantId, isGlobal, includeGlobal, search, paginate } = req.query;

    const where = { isDeleted: false };

    if (isGlobal === 'true') {
      // Sadece global kategoriler
      where.isGlobal = true;
    } else if (restaurantId) {
      if (includeGlobal === 'true') {
        // Hem restoran hem global kategoriler (QR menü için)
        where.OR = [
          { isGlobal: true },
          { restaurantId: restaurantId }
        ];
      } else {
        // Sadece restorana özel kategoriler
        where.isGlobal = false;
        where.restaurantId = restaurantId;
      }
    }

    // Search filter
    if (search) {
      where.OR = where.OR || [];
      where.OR.push(
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      );
    }

    // Pagination (optional - QR menu doesn't need pagination)
    let paginationOptions = {};
    if (paginate === 'true') {
      const { page, limit, skip } = parsePaginationParams(req.query);
      paginationOptions = { skip, take: limit, page, limit };
    }

    const queryOptions = {
      where,
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { order: 'asc' }
    };

    if (paginate === 'true') {
      queryOptions.skip = paginationOptions.skip;
      queryOptions.take = paginationOptions.take;

      // Get total count
      const totalCount = await prisma.category.count({ where });
      
      const categories = await prisma.category.findMany(queryOptions);

      return res.json(createPaginatedResponse(categories, totalCount, {
        page: paginationOptions.page,
        limit: paginationOptions.limit
      }));
    }

    // Without pagination (for QR menu)
    const categories = await prisma.category.findMany(queryOptions);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// Kategori oluştur
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, image, order, isGlobal, restaurantId } = req.body;

    // Admin kontrolü (global kategori için)
    if (isGlobal && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Global kategori oluşturmak için admin yetkisi gerekli'
      });
    }

    // Restoran sahibi kendi restoranı için kategori oluşturabilir
    if (!isGlobal && restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      if (!restaurant || restaurant.ownerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Bu restoran için kategori oluşturma yetkiniz yok'
        });
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        image,
        order: order || 0,
        isGlobal: isGlobal || false,
        restaurantId: isGlobal ? null : restaurantId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Kategori güncelle
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image, order } = req.body;

    const existing = await prisma.category.findUnique({
      where: { id, isDeleted: false },
      include: { restaurant: true }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    // Yetki kontrolü
    if (existing.isGlobal && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Global kategoriyi güncellemek için admin yetkisi gerekli'
      });
    }

    if (!existing.isGlobal && existing.restaurant?.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu kategoriyi güncelleme yetkiniz yok'
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        image,
        order
      }
    });

    res.json({
      success: true,
      message: 'Kategori başarıyla güncellendi',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Kategori sil
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({
      where: { id, isDeleted: false },
      include: { 
        restaurant: true,
        _count: {
          select: { products: true }
        }
      }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    // Yetki kontrolü
    if (existing.isGlobal && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Global kategoriyi silmek için admin yetkisi gerekli'
      });
    }

    if (!existing.isGlobal && existing.restaurant?.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu kategoriyi silme yetkiniz yok'
      });
    }

    // Kategoriye bağlı ürünleri de soft delete yap
    if (existing._count.products > 0) {
      await prisma.product.updateMany({
        where: { 
          categoryId: id,
          isDeleted: false
        },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });
    }

    // Kategoriyi soft delete
    await prisma.category.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: existing._count.products > 0 
        ? `Kategori ve ${existing._count.products} ürün başarıyla silindi`
        : 'Kategori başarıyla silindi'
    });
  } catch (error) {
    next(error);
  }
};

// Global kategoriyi ürünleriyle birlikte restorana kopyala
exports.copyGlobalCategoryWithProducts = async (req, res, next) => {
  try {
    const { categoryId, restaurantId, productPrices, productActiveStates } = req.body;
    // productPrices format: { productId: price, ... }
    // productActiveStates format: { productId: boolean, ... }

    // Restoran kontrolü
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant || restaurant.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu restoran için işlem yapma yetkiniz yok'
      });
    }

    // Global kategoriyi ve ürünlerini al
    const globalCategory = await prisma.category.findUnique({
      where: { id: categoryId, isDeleted: false, isGlobal: true },
      include: {
        products: {
          where: { isDeleted: false, isGlobal: true }
        }
      }
    });

    if (!globalCategory) {
      return res.status(404).json({
        success: false,
        message: 'Global kategori bulunamadı'
      });
    }

    // Kategoriyi kopyala
    const copiedCategory = await prisma.category.create({
      data: {
        name: globalCategory.name,
        description: globalCategory.description,
        image: globalCategory.image,
        order: globalCategory.order,
        isGlobal: false,
        restaurantId: restaurantId
      }
    });

    // Ürünleri kopyala
    const copiedProducts = await Promise.all(
      globalCategory.products.map(product => {
        const isActive = productActiveStates?.[product.id] !== false; // Default: true
        const price = isActive ? (productPrices?.[product.id] || 0) : 0;
        
        return prisma.product.create({
          data: {
            name: product.name,
            description: product.description,
            image: product.image,
            basePrice: price, // Aktif ürünler için fiyat, pasif için 0
            isGlobal: false,
            isActive: isActive, // Kullanıcının seçtiği durum
            restaurantId: restaurantId,
            categoryId: copiedCategory.id
          }
        });
      })
    );

    res.json({
      success: true,
      message: `Kategori ve ${copiedProducts.length} ürün başarıyla kopyalandı`,
      data: {
        category: copiedCategory,
        products: copiedProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

// Global kategorileri restorana kopyala (eski fonksiyon - ürünsüz)
exports.copyGlobalCategories = async (req, res, next) => {
  try {
    const { restaurantId } = req.body;

    // Restoran kontrolü
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant || restaurant.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu restoran için işlem yapma yetkiniz yok'
      });
    }

    // Global kategorileri al
    const globalCategories = await prisma.category.findMany({
      where: { isGlobal: true, isDeleted: false }
    });

    // Kategorileri kopyala
    const copiedCategories = await Promise.all(
      globalCategories.map(cat => 
        prisma.category.create({
          data: {
            name: cat.name,
            description: cat.description,
            image: cat.image,
            order: cat.order,
            isGlobal: false,
            restaurantId: restaurantId
          }
        })
      )
    );

    res.json({
      success: true,
      message: 'Global kategoriler başarıyla kopyalandı',
      data: copiedCategories
    });
  } catch (error) {
    next(error);
  }
};

// Kategori sıralamasını güncelle
exports.reorderCategories = async (req, res, next) => {
  try {
    const { categoryOrders } = req.body;
    // categoryOrders format: [{ id: 'uuid', order: 0 }, ...]

    if (!Array.isArray(categoryOrders) || categoryOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sıralama verisi'
      });
    }

    // Her kategoriyi güncelle
    await Promise.all(
      categoryOrders.map(({ id, order }) =>
        prisma.category.update({
          where: { id },
          data: { order }
        })
      )
    );

    res.json({
      success: true,
      message: 'Kategori sıralaması güncellendi'
    });
  } catch (error) {
    next(error);
  }
};
