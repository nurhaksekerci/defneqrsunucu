/**
 * Tekrar eden randevu - sonraki tarih hesaplama
 */
function addRecurrence(startDate, recurrenceType) {
  const d = new Date(startDate);
  switch (recurrenceType) {
    case 'WEEKLY':
      d.setDate(d.getDate() + 7);
      break;
    case 'BIWEEKLY':
      d.setDate(d.getDate() + 14);
      break;
    case 'MONTHLY':
      d.setMonth(d.getMonth() + 1);
      break;
    default:
      return null;
  }
  return d;
}

module.exports = { addRecurrence };
