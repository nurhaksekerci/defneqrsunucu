"""
Veritabanındaki mevcut Hat kayıtları için örnek etkinlik ve rapor üretir.

  py manage.py seed_fake_events
  py manage.py seed_fake_events --per-hat 3
  py manage.py seed_fake_events --force   # [FAKE] etkinlikleri silip tüm hatlar için yeniden oluşturur

İlçe: sırayla tüm ilçeler döndürülür. Oluşturan: ilk süper kullanıcı veya ilk aktif kullanıcı.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from events.models import Event, EventReport
from org.models import District, Hat

User = get_user_model()

FAKE_PREFIX = "[FAKE] "

PLANNED_TITLES = (
    "Saha çalışması",
    "Bilgilendirme toplantısı",
    "Üye buluşması",
    "Mahalle ziyareti",
    "Koordinasyon toplantısı",
)

COMPLETED_TITLES = (
    "Tamamlanan buluşma",
    "Saha günü özeti",
    "İlçe çalışması",
    "Komisyon oturumu",
    "Dayanışma etkinliği",
)

REPORT_STATUSES = (
    EventReport.Status.PUBLISHED,
    EventReport.Status.REVIEW,
    EventReport.Status.DRAFT,
)


class Command(BaseCommand):
    help = "Mevcut hatlara örnek etkinlik ve (tamamlananlar için) rapor ekler"

    def add_arguments(self, parser):
        parser.add_argument(
            "--per-hat",
            type=int,
            default=2,
            help="Her hat için oluşturulacak etkinlik sayısı (varsayılan: 2)",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="[FAKE] ile başlayan tüm etkinlikleri silip yeniden oluştur",
        )

    def handle(self, *args, **options):
        per_hat = max(1, options["per_hat"])
        force = options["force"]

        districts = list(District.objects.order_by("id"))
        if not districts:
            self.stderr.write(
                self.style.ERROR("İlçe kaydı yok. Önce seed_org veya admin ile ilçe ekleyin."),
            )
            return

        hats = list(Hat.objects.order_by("id"))
        if not hats:
            self.stderr.write(self.style.ERROR("Hat kaydı yok."))
            return

        author = (
            User.objects.filter(is_superuser=True, is_active=True).first()
            or User.objects.filter(is_active=True).order_by("id").first()
        )
        if not author:
            self.stderr.write(
                self.style.ERROR(
                    "Aktif kullanıcı yok. Önce createsuperuser veya demo kullanıcı oluşturun.",
                ),
            )
            return

        if force:
            qs = Event.objects.filter(title__startswith=FAKE_PREFIX)
            n, _ = qs.delete()
            if n:
                self.stdout.write(
                    self.style.WARNING(f"Silinen [FAKE] etkinlik (ve ilişkileri): {n}"),
                )

        now = timezone.now()
        base = now.replace(hour=10, minute=0, second=0, microsecond=0)
        d_idx = 0
        created_events = 0
        created_reports = 0
        skipped_hats = 0

        for hi, hat in enumerate(hats):
            if not force and Event.objects.filter(
                hat=hat, title__startswith=FAKE_PREFIX
            ).exists():
                skipped_hats += 1
                continue

            for j in range(per_hat):
                district = districts[d_idx % len(districts)]
                d_idx += 1

                # Çift indeks: tamamlandı + rapor; tek: planlandı
                completed = j % 2 == 0
                titles = COMPLETED_TITLES if completed else PLANNED_TITLES
                title_core = titles[(hi + j) % len(titles)]
                title = f"{FAKE_PREFIX}{title_core} — {hat.name}"

                days = -14 + hi * 3 + j * 5
                starts = base + timedelta(days=days)

                e = Event.objects.create(
                    title=title[:255],
                    description=(
                        f"Otomatik örnek etkinlik (hat: {hat.name}, ilçe: {district.name})."
                    ),
                    starts_at=starts,
                    status=(
                        Event.Status.COMPLETED if completed else Event.Status.PLANNED
                    ),
                    location_kind=Event.LocationKind.ADDRESS,
                    address_text=f"{district.name} — örnek adres satırı",
                    hat=hat,
                    district=district,
                    created_by=author,
                )
                created_events += 1

                if completed:
                    e.completed_at = starts + timedelta(hours=2)
                    e.save(update_fields=["completed_at", "updated_at"])
                    st = REPORT_STATUSES[(hi + j) % len(REPORT_STATUSES)]
                    EventReport.objects.create(
                        event=e,
                        body=(
                            f"Örnek rapor özeti: {title_core}. Katılım ve gözlemler "
                            f"({district.name} / {hat.name})."
                        ),
                        status=st,
                    )
                    created_reports += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Etkinlik: {created_events} oluşturuldu, rapor: {created_reports}, "
                f"atlanan hat (zaten [FAKE] vardı): {skipped_hats}"
            ),
        )
        if skipped_hats and not force:
            self.stdout.write(
                self.style.NOTICE(
                    "Tüm hatları yenilemek için: py manage.py seed_fake_events --force",
                ),
            )
