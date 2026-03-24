# Seçim bölgesi hat üzerinde tutulur (Ana Kademe İlçe Başkanlığı).

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models

# Hat.CoordinationLine / CoordinationBucket değerleri (migrations içinde model import etme)
ILCE_BASKANLIGI = "ilce_baskanligi"
ANA_KADEME = "ana_kademe"


def copy_zone_from_districts_to_hats(apps, schema_editor):
    """İlçe adı hat adında geçiyorsa, ilçenin seçim bölgesini aktar."""
    HatModel = apps.get_model("org", "Hat")
    District = apps.get_model("org", "District")

    ilce_line = ILCE_BASKANLIGI
    ana_kademe = ANA_KADEME

    districts = list(District.objects.exclude(election_zone__isnull=True))
    districts.sort(key=lambda d: -len(d.name))

    qs = HatModel.objects.filter(
        coordination_line=ilce_line,
        coordination_bucket=ana_kademe,
    )
    for hat in qs:
        name = hat.name or ""
        zone = None
        for d in districts:
            if d.name and d.name in name:
                zone = d.election_zone
                break
        if zone is not None:
            hat.election_zone = zone
            hat.save(update_fields=["election_zone"])


def reverse_clear_hat_zones(apps, schema_editor):
    HatModel = apps.get_model("org", "Hat")
    HatModel.objects.all().update(election_zone=None)


class Migration(migrations.Migration):
    dependencies = [
        ("org", "0009_district_election_zone"),
    ]

    operations = [
        migrations.AddField(
            model_name="hat",
            name="election_zone",
            field=models.PositiveSmallIntegerField(
                blank=True,
                help_text="İstanbul milletvekili seçim bölgesi (1, 2 veya 3). Ana Kademe İlçe Başkanlığı hatları için İl Başkanlığı sidebar sekmelerinde kullanılır.",
                null=True,
                validators=[
                    MinValueValidator(1),
                    MaxValueValidator(3),
                ],
                verbose_name="seçim bölgesi",
            ),
        ),
        migrations.RunPython(copy_zone_from_districts_to_hats, reverse_clear_hat_zones),
    ]
