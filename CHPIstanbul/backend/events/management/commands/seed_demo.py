"""
Örnek hatlar, kullanıcılar, etkinlikler ve raporlar ekler.

  py manage.py seed_demo
  py manage.py seed_demo --force   # [DEMO] etkinlikleri silip yeniden yükler

Giriş (şifre: demo123):
  demo_il          — il yetkilisi, Ana Kademe il koordinasyon
  demo_genclik     — Kadıköy, Gençlik hattı
  demo_koord_sisli — Şişli, ilçe koordinasyon (Ana Kademe)
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import UserProfile
from events.models import Event, EventReport
from org.models import District, Hat

User = get_user_model()

DEMO_PREFIX = "[DEMO] "


def _hat(code: str, defaults: dict) -> Hat:
    h, _ = Hat.objects.update_or_create(code=code, defaults=defaults)
    return h


class Command(BaseCommand):
    help = "Fake demo verisi: org seed + hat/kullanici/etkinlik/rapor"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="[DEMO] etkinliklerini sil ve yeniden oluştur",
        )

    def handle(self, *args, **options):
        call_command("seed_org")

        # Koordinasyon ve kol yapısı (kod sabit)
        h_il_koord = _hat(
            "ana-koord-il",
            {
                "name": "Ana Kademe (İl koordinasyon)",
                "is_coordination_hat": True,
                "coordination_bucket": None,
                "coordination_line": None,
            },
        )
        h_sisli_koord = _hat(
            "ana-koord-sisli",
            {
                "name": "Şişli Ana Kademe (İlçe koordinasyon)",
                "is_coordination_hat": True,
                "coordination_bucket": None,
                "coordination_line": None,
            },
        )
        _hat(
            "ak-ib-kadikoy",
            {
                "name": "Kadıköy — AK İlçe Başkanlığı",
                "is_coordination_hat": False,
                "coordination_bucket": Hat.CoordinationBucket.ANA_KADEME,
                "coordination_line": Hat.CoordinationLine.ILCE_BASKANLIGI,
            },
        )
        _hat(
            "ak-kom-secim",
            {
                "name": "Seçim Komisyonu (AK)",
                "is_coordination_hat": False,
                "coordination_bucket": Hat.CoordinationBucket.ANA_KADEME,
                "coordination_line": Hat.CoordinationLine.KOMISYON,
            },
        )
        h_genclik = Hat.objects.filter(name="Gençlik Kolları").first()
        if h_genclik:
            Hat.objects.filter(pk=h_genclik.pk).update(
                coordination_bucket=Hat.CoordinationBucket.GENCLIK,
                coordination_line=None,
                is_coordination_hat=False,
            )
        _hat(
            "gk-ib-maltepe",
            {
                "name": "Maltepe — GK İlçe Başkanlığı",
                "is_coordination_hat": False,
                "coordination_bucket": Hat.CoordinationBucket.GENCLIK,
                "coordination_line": Hat.CoordinationLine.ILCE_BASKANLIGI,
            },
        )
        _hat(
            "gk-kom-egitim",
            {
                "name": "Eğitim Komisyonu (GK)",
                "is_coordination_hat": False,
                "coordination_bucket": Hat.CoordinationBucket.GENCLIK,
                "coordination_line": Hat.CoordinationLine.KOMISYON,
            },
        )
        h_kadin = Hat.objects.filter(name="Kadın Kolları").first()
        if h_kadin:
            Hat.objects.filter(pk=h_kadin.pk).update(
                coordination_bucket=Hat.CoordinationBucket.KADIN,
                coordination_line=None,
                is_coordination_hat=False,
            )
        _hat(
            "kk-ib-bakirkoy",
            {
                "name": "Bakırköy — KK İlçe Başkanlığı",
                "is_coordination_hat": False,
                "coordination_bucket": Hat.CoordinationBucket.KADIN,
                "coordination_line": Hat.CoordinationLine.ILCE_BASKANLIGI,
            },
        )

        d_kadikoy = District.objects.get(name="Kadıköy")
        d_sisli = District.objects.get(name="Şişli")
        d_maltepe = District.objects.get(name="Maltepe")
        d_bakirkoy = District.objects.get(name="Bakırköy")

        h_ak_ib_kdk = Hat.objects.get(code="ak-ib-kadikoy")
        h_ak_kom = Hat.objects.get(code="ak-kom-secim")
        h_gk_ib = Hat.objects.get(code="gk-ib-maltepe")
        h_gk_kom = Hat.objects.get(code="gk-kom-egitim")
        h_kk_ib = Hat.objects.get(code="kk-ib-bakirkoy")
        genclik_hat = Hat.objects.filter(name="Gençlik Kolları").first()
        kadin_hat = Hat.objects.filter(name="Kadın Kolları").first()

        def upsert_user(
            username: str,
            *,
            hat: Hat,
            district: District | None,
            is_provincial: bool,
        ):
            u, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@demo.local",
                    "first_name": "Demo",
                    "last_name": username.replace("_", " ").title(),
                },
            )
            u.set_password("demo123")
            u.save()
            p, _ = UserProfile.objects.get_or_create(user=u)
            p.hat = hat
            p.district = district
            p.is_provincial_official = is_provincial
            p.save()
            self.stdout.write(
                f"  Kullanıcı {'oluşturuldu' if created else 'güncellendi'}: {username} / demo123",
            )

        upsert_user(
            "demo_il",
            hat=h_il_koord,
            district=None,
            is_provincial=True,
        )
        if genclik_hat:
            upsert_user(
                "demo_genclik",
                hat=genclik_hat,
                district=d_kadikoy,
                is_provincial=False,
            )
        upsert_user(
            "demo_koord_sisli",
            hat=h_sisli_koord,
            district=d_sisli,
            is_provincial=False,
        )

        demo_user = User.objects.get(username="demo_il")

        if options["force"]:
            n, _ = Event.objects.filter(title__startswith=DEMO_PREFIX).delete()
            if n:
                self.stdout.write(self.style.WARNING(f"  Silinen demo etkinlik ilişkisi: {n}"))

        if Event.objects.filter(title__startswith=DEMO_PREFIX).exists():
            self.stdout.write(
                self.style.NOTICE(
                    "  Demo etkinlik zaten var. Yenilemek için: seed_demo --force",
                ),
            )
            self.stdout.write(self.style.SUCCESS("seed_demo tamam."))
            return

        now = timezone.now()
        base = now.replace(hour=10, minute=0, second=0, microsecond=0)

        def ev(
            title: str,
            *,
            hat: Hat,
            district: District,
            status: str,
            days_offset: int,
            has_report: bool,
            report_status: str | None = None,
        ):
            starts = base + timedelta(days=days_offset)
            e = Event.objects.create(
                title=f"{DEMO_PREFIX}{title}",
                description=f"Örnek etkinlik açıklaması: {title}",
                starts_at=starts,
                status=status,
                location_kind=Event.LocationKind.ADDRESS,
                address_text=f"{district.name} merkez mahalle",
                hat=hat,
                district=district,
                created_by=demo_user,
            )
            if status == Event.Status.COMPLETED:
                e.completed_at = starts + timedelta(hours=3)
                e.save(update_fields=["completed_at", "updated_at"])
            if has_report and status == Event.Status.COMPLETED:
                EventReport.objects.create(
                    event=e,
                    body=f"Örnek rapor özeti: {title}. Katılım ve notlar.",
                    status=report_status or EventReport.Status.REVIEW,
                )

        ev(
            "Mahalle saha çalışması",
            hat=h_ak_ib_kdk,
            district=d_kadikoy,
            status=Event.Status.PLANNED,
            days_offset=5,
            has_report=False,
        )
        ev(
            "Komisyon toplantısı",
            hat=h_ak_kom,
            district=d_sisli,
            status=Event.Status.PLANNED,
            days_offset=8,
            has_report=False,
        )
        if genclik_hat:
            ev(
                "Gençlik buluşması",
                hat=genclik_hat,
                district=d_kadikoy,
                status=Event.Status.PLANNED,
                days_offset=12,
                has_report=False,
            )
        ev(
            "Tamamlanan saha günü",
            hat=h_ak_ib_kdk,
            district=d_maltepe,
            status=Event.Status.COMPLETED,
            days_offset=-3,
            has_report=True,
            report_status=EventReport.Status.PUBLISHED,
        )
        ev(
            "Rapor bekleyen etkinlik",
            hat=h_gk_ib,
            district=d_maltepe,
            status=Event.Status.COMPLETED,
            days_offset=-7,
            has_report=False,
        )
        if kadin_hat:
            ev(
                "Kadın kolları dayanışma",
                hat=kadin_hat,
                district=d_bakirkoy,
                status=Event.Status.COMPLETED,
                days_offset=-10,
                has_report=True,
                report_status=EventReport.Status.REVIEW,
            )
        ev(
            "GK komisyon çalışması",
            hat=h_gk_kom,
            district=d_kadikoy,
            status=Event.Status.PLANNED,
            days_offset=15,
            has_report=False,
        )
        ev(
            "KK ilçe ziyareti",
            hat=h_kk_ib,
            district=d_bakirkoy,
            status=Event.Status.PLANNED,
            days_offset=20,
            has_report=False,
        )

        self.stdout.write(self.style.SUCCESS("  [DEMO] etkinlikler ve raporlar eklendi."))
        self.stdout.write(self.style.SUCCESS("seed_demo tamam."))
