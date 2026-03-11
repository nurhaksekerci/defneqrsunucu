'use client';

interface AppointmentLike {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  staff: { id: string; fullName: string };
  service: { id: string; name: string; duration: number; price: number };
  customer: { id: string; fullName: string; phone: string };
}

interface StaffLike {
  id: string;
}

interface WeekCalendarViewProps {
  weekDays: Date[];
  today: Date;
  appointments: AppointmentLike[];
  staff: StaffLike[];
  canAddAppointment: boolean;
  onAddClick: (day: Date) => void;
  onCompleteClick: (a: AppointmentLike) => void;
  onDeleteClick: (id: string) => void;
  getAppointmentsForDay: (date: Date) => AppointmentLike[];
  getTimeString: (dateStr: string) => string;
  statusLabels: Record<string, string>;
  staffColors: string[];
}

export function WeekCalendarView({
  weekDays,
  today,
  appointments,
  staff,
  canAddAppointment,
  onAddClick,
  onCompleteClick,
  onDeleteClick,
  getAppointmentsForDay,
  getTimeString,
  statusLabels,
  staffColors,
}: WeekCalendarViewProps) {
  const ROW_HEIGHT = 48;
  const START_HOUR = 6;

  return (
    <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm min-w-[900px]">
      <div className="flex border-b border-gray-200">
        <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50 opacity-80" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`flex-1 min-w-0 p-2 text-center border-r border-gray-200 last:border-r-0 ${
              day.getTime() === today.getTime() ? 'bg-primary-50' : 'bg-gray-50'
            }`}
          >
            <div className="text-xs font-medium text-gray-500">{day.toLocaleDateString('tr-TR', { weekday: 'short' })}</div>
            <div className={`text-lg font-semibold ${day.getTime() === today.getTime() ? 'text-primary-600' : 'text-gray-900'}`}>
              {day.getDate()}
            </div>
            <div className="text-xs text-gray-500">{day.toLocaleDateString('tr-TR', { month: 'short' })}</div>
          </div>
        ))}
      </div>
      <div className="flex" style={{ height: 17 * 48 }}>
        <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50">
          {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
            <div key={h} className="h-12 border-b border-gray-100 text-right pr-2 text-xs text-gray-500 leading-[48px]">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {weekDays.map((day) => {
          const dayAppointments = getAppointmentsForDay(day).sort(
            (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
          );
          return (
            <div
              key={day.toISOString()}
              className={`flex-1 min-w-0 relative border-r border-gray-200 last:border-r-0 ${
                day.getTime() === today.getTime() ? 'bg-primary-50' : 'bg-white'
              }`}
            >
              {Array.from({ length: 17 }, (_, i) => (
                <div key={i} className="absolute left-0 right-0 border-b border-gray-100" style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }} />
              ))}
              {Array.from({ length: 17 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onAddClick(day)}
                  disabled={!canAddAppointment}
                  className="absolute left-0 right-0 opacity-0 hover:opacity-100 hover:bg-primary-50 transition-opacity disabled:pointer-events-none"
                  style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                />
              ))}
              {dayAppointments.map((a, idx) => {
                const start = new Date(a.startAt);
                const end = new Date(a.endAt);
                const startMinutes = start.getHours() * 60 + start.getMinutes();
                const endMinutes = end.getHours() * 60 + end.getMinutes();
                const top = Math.max(0, (startMinutes - START_HOUR * 60) * ROW_HEIGHT / 60);
                const durationMinutes = endMinutes - startMinutes;
                const height = Math.max(24, durationMinutes * ROW_HEIGHT / 60);
                const staffIdx = staff.findIndex((s) => s.id === a.staff.id);
                return (
                  <div
                    key={a.id}
                    className={`absolute left-1 right-1 rounded overflow-hidden shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${staffColors[(staffIdx >= 0 ? staffIdx : idx) % staffColors.length]}`}
                    style={{ top: top + 2, height: height - 4, minHeight: 20 }}
                    title={`${a.customer.fullName} - ${a.service.name} ${getTimeString(a.startAt)}`}
                  >
                    <div className="p-1.5 h-full overflow-hidden text-xs">
                      <div className="font-semibold truncate">{a.customer.fullName}</div>
                      <div className="truncate opacity-90">{a.service.name}</div>
                      <div className="opacity-80">{getTimeString(a.startAt)}</div>
                      <div className="flex gap-1 mt-0.5 flex-wrap items-center">
                        <span className={`px-1 rounded text-[9px] ${a.status === 'COMPLETED' ? 'bg-green-200' : a.status === 'CANCELLED' ? 'bg-red-200' : 'bg-amber-200'}`}>
                          {statusLabels[a.status] || a.status}
                        </span>
                        {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); onCompleteClick(a); }} className="text-[9px] font-medium hover:underline">
                            Tamamla
                          </button>
                        )}
                        <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteClick(a.id); }} className="text-[9px] text-red-600 hover:underline ml-auto">
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
