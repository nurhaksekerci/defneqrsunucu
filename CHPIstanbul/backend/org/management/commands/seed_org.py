from django.core.management.base import BaseCommand

from org.models import District, Hat

HAT_NAMES = [
    "Ana Kademe",
    "Gençlik Kolları",
    "Kadın Kolları",
    "Komisyon",
]

DISTRICTS = [
    "Adalar",
    "Arnavutköy",
    "Ataşehir",
    "Avcılar",
    "Bağcılar",
    "Bahçelievler",
    "Bakırköy",
    "Başakşehir",
    "Bayrampaşa",
    "Beşiktaş",
    "Beykoz",
    "Beylikdüzü",
    "Beyoğlu",
    "Büyükçekmece",
    "Çatalca",
    "Çekmeköy",
    "Esenler",
    "Esenyurt",
    "Eyüpsultan",
    "Fatih",
    "Gaziosmanpaşa",
    "Güngören",
    "Kadıköy",
    "Kağıthane",
    "Kartal",
    "Küçükçekmece",
    "Maltepe",
    "Pendik",
    "Sancaktepe",
    "Sarıyer",
    "Silivri",
    "Sultanbeyli",
    "Sultangazi",
    "Şile",
    "Şişli",
    "Tuzla",
    "Ümraniye",
    "Üsküdar",
    "Zeytinburnu",
]


class Command(BaseCommand):
    help = "Hat ve Istanbul ilcelerini veritabanina ekler (idempotent). Kod alani ad'dan otomatik."

    def handle(self, *args, **options):
        for name in HAT_NAMES:
            obj, created = Hat.objects.get_or_create(name=name)
            if created or not obj.code:
                obj.save()
        for name in DISTRICTS:
            District.objects.get_or_create(name=name)
        self.stdout.write(self.style.SUCCESS("Hat ve ilce seed tamam."))
