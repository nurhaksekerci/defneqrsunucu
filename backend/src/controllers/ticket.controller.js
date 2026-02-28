const prisma = require('../config/database');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');
const { generateTicketNumber } = require('../utils/ticketNumberGenerator');
const {
  sendTicketCreatedEmail,
  sendTicketRepliedEmail,
  sendTicketWaitingForCustomerEmail,
  sendTicketResolvedEmail
} = require('../utils/emailService');
const logger = require('../utils/logger');

const ticketInclude = {
  user: { select: { id: true, fullName: true, email: true } },
  restaurant: { select: { id: true, name: true, slug: true } },
  assignedTo: { select: { id: true, fullName: true, email: true } },
  _count: { select: { messages: true } }
};

// Kullanıcının kendi taleplerini listele
exports.getMyTickets = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { status, category } = req.query;
    const userId = req.user.id;

    const where = { userId };

    if (status) where.status = status;
    if (category) where.category = category;

    const totalCount = await prisma.supportTicket.count({ where });

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: ticketInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    res.json(createPaginatedResponse(tickets, totalCount, { page, limit }));
  } catch (error) {
    next(error);
  }
};

// Tüm talepleri listele (Admin/Staff)
exports.getAllTickets = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { status, category, priority, search } = req.query;

    const where = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const totalCount = await prisma.supportTicket.count({ where });

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: ticketInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    res.json(createPaginatedResponse(tickets, totalCount, { page, limit }));
  } catch (error) {
    next(error);
  }
};

// Tek talep detayı
exports.getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        restaurant: { select: { id: true, name: true, slug: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
        messages: {
          where: user.role === 'ADMIN' || user.role === 'STAFF' ? {} : { isInternal: false },
          include: {
            author: { select: { id: true, fullName: true, email: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Talep bulunamadı' });
    }

    if (user.role !== 'ADMIN' && user.role !== 'STAFF' && ticket.userId !== user.id) {
      return res.status(403).json({ success: false, message: 'Bu talebe erişim yetkiniz yok' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

// Yeni talep oluştur
exports.createTicket = async (req, res, next) => {
  try {
    const { subject, description, category, priority, restaurantId } = req.body;
    const userId = req.user.id;

    if (restaurantId) {
      const restaurant = await prisma.restaurant.findFirst({
        where: { id: restaurantId, ownerId: userId, isDeleted: false }
      });
      if (!restaurant) {
        return res.status(400).json({ success: false, message: 'Geçersiz restoran' });
      }
    }

    const ticketNumber = await generateTicketNumber();

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId,
        restaurantId: restaurantId || null,
        subject,
        description,
        category,
        priority: priority || 'MEDIUM',
        status: 'OPEN'
      },
      include: ticketInclude
    });

    await sendTicketCreatedEmail(ticket);
    logger.info('Destek talebi oluşturuldu', { ticketId: ticket.id, ticketNumber: ticket.ticketNumber });

    res.status(201).json({ success: true, data: ticket, message: 'Destek talebiniz oluşturuldu' });
  } catch (error) {
    next(error);
  }
};

// Talep güncelle (Admin/Staff veya kendi talebi - sadece mesaj ekleyebilir)
exports.updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedToId, resolution } = req.body;
    const user = req.user;

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Talep bulunamadı' });
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'STAFF';

    if (!isAdmin && ticket.userId !== user.id) {
      return res.status(403).json({ success: false, message: 'Bu talebi güncelleme yetkiniz yok' });
    }

    const updateData = {};
    if (isAdmin) {
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
      if (resolution !== undefined) updateData.resolution = resolution;
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date();
        updateData.resolvedById = user.id;
        updateData.closedAt = new Date();
      }
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: { ...ticketInclude, user: { select: { id: true, fullName: true, email: true } } }
    });

    // Durum değişikliğinde kullanıcıya mail gönder
    if (isAdmin && status) {
      if (status === 'WAITING_CUSTOMER') {
        await sendTicketWaitingForCustomerEmail(updated);
        logger.info('Destek talebi - sizden cevap bekleniyor maili gönderildi', { ticketId: id });
      } else if (status === 'RESOLVED' || status === 'CLOSED') {
        const ticketForEmail = await prisma.supportTicket.findUnique({
          where: { id },
          include: { user: { select: { id: true, fullName: true, email: true } } }
        });
        await sendTicketResolvedEmail(ticketForEmail);
        logger.info('Destek talebi - çözüldü maili gönderildi', { ticketId: id });
      }
    }

    res.json({ success: true, data: updated, message: 'Talep güncellendi' });
  } catch (error) {
    next(error);
  }
};

// Talep mesajı ekle
exports.addMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, isInternal } = req.body;
    const user = req.user;

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Talep bulunamadı' });
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'STAFF';

    if (!isAdmin && ticket.userId !== user.id) {
      return res.status(403).json({ success: false, message: 'Bu talebe mesaj ekleme yetkiniz yok' });
    }

    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
      return res.status(400).json({ success: false, message: 'Kapalı taleplere mesaj eklenemez' });
    }

    const internal = isAdmin && isInternal === true;

    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        authorId: user.id,
        message: message.trim(),
        isInternal: internal
      },
      include: {
        author: { select: { id: true, fullName: true, email: true } }
      }
    });

    // Admin/Staff müşteriye yanıt verdiğinde (iç not değilse) mail gönder
    if (isAdmin && !internal) {
      const fullTicket = await prisma.supportTicket.findUnique({
        where: { id },
        include: { user: { select: { id: true, fullName: true, email: true } } }
      });
      const replyPreview = message.trim().length > 100 ? message.trim().substring(0, 100) + '...' : message.trim();
      await sendTicketRepliedEmail(fullTicket, replyPreview);
      logger.info('Destek talebi - cevaplandı maili gönderildi', { ticketId: id });
    }

    res.status(201).json({ success: true, data: msg, message: 'Mesaj gönderildi' });
  } catch (error) {
    next(error);
  }
};
