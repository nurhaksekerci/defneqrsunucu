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
  fullName: string;
  color?: string | null;
}

interface StaffCalendarViewProps {
  weekDays: Date[];
  today: Date;
  staff: StaffLike[];
  canAddAppointment: boolean;
  onAddClick: (day: Date, staffId: string) => void;
  onAppointmentClick: (a: AppointmentLike) => void;
  getAppointmentsForStaffAndDay: (staffId: string, date: Date) => AppointmentLike[];
  getTimeString: (dateStr: string) => string;
  statusLabels: Record<string, string>;
  staffColors: string[];
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4'];

export function StaffCalendarView({
  weekDays,
  today,
  staff,
  canAddAppointment,
  onAddClick,
  onAppointmentClick,
  getAppointmentsForStaffAndDay,
  getTimeString,
  statusLabels,
  staffColors,
}: StaffCalendarViewProps) {
  const ROW_HEIGHT = 48;
  const START_HOUR = 6;

  if (staff.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {staff.map((s, staffIdx) => {
        const color = s.color || DEFAULT_COLORS[staffIdx % DEFAULT_COLORS.length];
        return (
          <div key={s.id} className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm min-w-[900px]">
            <div className="flex border-b border-gray-200 bg-gray-50 px-3 py-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: color }} />
              <span className="ml-2 font-semibold text-gray-900">{s.fullName}</span>
            </div>
            <div className="flex border-b border-gray-200">
              <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50 opacity-80" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`flex-1 min-w-0 p-2 text-center border-r border-gray-200 last:border-r-0 ${
                    day.getTime() === today.getTime() ? 'bg-primary-50' : 'bg-white'
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
            <div className="flex" style={{ height: 17 * ROW_HEIGHT }}>
              <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50">
                {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                  <div key={h} className="h-12 border-b border-gray-100 text-right pr-2 text-xs text-gray-500 leading-[48px]">
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
              {weekDays.map((day) => {
                const dayAppointments = getAppointmentsForStaffAndDay(s.id, day).sort(
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
                        onClick={() => onAddClick(day, s.id)}
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
                      return (
                        <div
                          key={a.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onAppointmentClick(a)}
                          onKeyDown={(e) => e.key === 'Enter' && onAppointmentClick(a)}
                          className={`absolute left-1 right-1 rounded overflow-hidden shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${staffColors[staffIdx % staffColors.length]}`}
                          style={{ top: top + 2, height: height - 4, minHeight: 20 }}
                          title={`${a.customer.fullName} - ${a.service.name} ${getTimeString(a.startAt)} (tıklayarak detay)`}
                        >
                          <div className="p-1.5 h-full overflow-hidden text-xs">
                            <div className="font-semibold truncate">{a.customer.fullName}</div>
                            <div className="truncate opacity-90">{a.service.name}</div>
                            <div className="opacity-80">{getTimeString(a.startAt)}</div>
                            <span className={`inline-block mt-0.5 px-1 rounded text-[9px] ${a.status === 'COMPLETED' ? 'bg-green-200' : a.status === 'CANCELLED' ? 'bg-red-200' : 'bg-amber-200'}`}>
                              {statusLabels[a.status] || a.status}
                            </span>
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
      })}
    </div>
  );
}
