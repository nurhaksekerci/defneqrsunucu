# İstanbul milletvekili seçim bölgeleri (1 / 2 / 3) — YSK bölgelendirmesine göre.

from django.db import migrations, models

# Kaynak: İstanbul MV seçim bölgeleri (ilçe dağılımı)
ELECTION_ZONE_1 = {
    "Arnavutköy",
    "Avcılar",
    "Bağcılar",
    "Bahçelievler",
    "Bakırköy",
    "Başakşehir",
    "Bayrampaşa",
    "Beşiktaş",
    "Beylikdüzü",
    "Beyoğlu",
    "Büyükçekmece",
    "Çatalca",
    "Esenler",
    "Esenyurt",
    "Eyüpsultan",
    "Fatih",
    "Gaziosmanpaşa",
    "Güngören",
    "Kağıthane",
    "Küçükçekmece",
    "Sarıyer",
    "Silivri",
    "Şişli",
    "Zeytinburnu",
}
ELECTION_ZONE_2 = {
    "Adalar",
    "Beykoz",
    "Kadıköy",
    "Kartal",
    "Maltepe",
    "Pendik",
    "Sancaktepe",
    "Sultanbeyli",
    "Şile",
    "Tuzla",
    "Ümraniye",
    "Üsküdar",
}
ELECTION_ZONE_3 = {
    "Ataşehir",
    "Çekmeköy",
    "Sultangazi",
}


def set_election_zones(apps, schema_editor):
    District = apps.get_model("org", "District")
    for d in District.objects.all():
        name = d.name
        if name in ELECTION_ZONE_1:
            d.election_zone = 1
        elif name in ELECTION_ZONE_2:
            d.election_zone = 2
        elif name in ELECTION_ZONE_3:
            d.election_zone = 3
        else:
            d.election_zone = None
        d.save(update_fields=["election_zone"])


def noop_reverse(apps, schema_editor):
    District = apps.get_model("org", "District")
    District.objects.all().update(election_zone=None)


class Migration(migrations.Migration):
    dependencies = [
        ("org", "0008_coordination_line_il_baskanligi"),
    ]

    operations = [
        migrations.AddField(
            model_name="district",
            name="election_zone",
            field=models.PositiveSmallIntegerField(
                blank=True,
                help_text="İstanbul milletvekili seçim bölgesi (1, 2 veya 3). İl Başkanlığı görünümünde ilçeler bu alana göre gruplanır.",
                null=True,
                verbose_name="seçim bölgesi",
            ),
        ),
        migrations.RunPython(set_election_zones, noop_reverse),
    ]
