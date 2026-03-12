/**
 * Destek talebi numarası oluşturucu
 * Format: TKT-YYYYMMDD-XXXXX (5 haneli sıra)
 */
const prisma = require('../config/database');

async function generateTicketNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `TKT-${today}-`;

  const lastTicket = await prisma.supportTicket.findFirst({
    where: { ticketNumber: { startsWith: prefix } },
    orderBy: { ticketNumber: 'desc' },
    select: { ticketNumber: true }
  });

  let seq = 1;
  if (lastTicket) {
    const parts = lastTicket.ticketNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  const seqStr = seq.toString().padStart(5, '0');
  return `${prefix}${seqStr}`;
}

module.exports = { generateTicketNumber };
