# Coğrafi hiyerarşi, komisyon, org birimi; Post/PlannedEvent org_unit FK.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def _ilce_code(GeographicNode, geo):
    n = geo
    while n:
        if n.level == 'ilce':
            return n.code
        pid = n.parent_id
        n = GeographicNode.objects.filter(pk=pid).first() if pid else None
    return ''


def seed_and_backfill(apps, schema_editor):
    GeographicNode = apps.get_model('chpist', 'GeographicNode')
    Commission = apps.get_model('chpist', 'Commission')
    OrgUnit = apps.get_model('chpist', 'OrgUnit')
    Post = apps.get_model('chpist', 'Post')
    PlannedEvent = apps.get_model('chpist', 'PlannedEvent')

    istanbul = GeographicNode.objects.create(
        parent=None, level='il', name='İstanbul', code='istanbul'
    )
    sb2 = GeographicNode.objects.create(
        parent=istanbul,
        level='secim_bolgesi',
        name='2. Seçim Bölgesi',
        code='sb_2',
    )
    zeytinburnu = GeographicNode.objects.create(
        parent=sb2, level='ilce', name='Zeytinburnu', code='zeytinburnu'
    )
    GeographicNode.objects.create(
        parent=zeytinburnu,
        level='mahalle',
        name='Nuripaşa Mahalle',
        code='nuripasa',
    )
    kadikoy = GeographicNode.objects.create(
        parent=sb2, level='ilce', name='Kadıköy', code='kadikoy'
    )
    GeographicNode.objects.create(
        parent=kadikoy,
        level='mahalle',
        name='Örnek Mahalle',
        code='ornek_mahalle',
    )

    arge = Commission.objects.create(
        name='AR-GE Komisyonu', slug='arge', active=True
    )

    def mk_ou(geo, branch, commission=None):
        ic = _ilce_code(GeographicNode, geo)
        return OrgUnit.objects.create(
            geographic_node=geo,
            branch=branch,
            commission=commission,
            ilce_code=ic,
        )

    z_map = {
        'ana_kademe': mk_ou(zeytinburnu, 'ana_kademe'),
        'genclik': mk_ou(zeytinburnu, 'genclik'),
        'kadin': mk_ou(zeytinburnu, 'kadin'),
        'komisyon': mk_ou(zeytinburnu, 'komisyon', commission=arge),
    }
    k_map = {
        'ana_kademe': mk_ou(kadikoy, 'ana_kademe'),
        'genclik': mk_ou(kadikoy, 'genclik'),
        'kadin': mk_ou(kadikoy, 'kadin'),
        'komisyon': mk_ou(kadikoy, 'komisyon', commission=arge),
    }
    mk_ou(istanbul, 'ana_kademe')

    def pick_unit(district_id: str, branch: str):
        m = z_map if district_id == 'zeytinburnu' else k_map
        if district_id not in ('zeytinburnu', 'kadikoy'):
            m = z_map
        return m.get(branch) or m['ana_kademe']

    for post in Post.objects.all():
        u = pick_unit(post.district_id, post.branch)
        post.org_unit_id = u.pk
        post.save(update_fields=['org_unit'])

    for ev in PlannedEvent.objects.all():
        d = 'zeytinburnu'
        op = (ev.org_path or '').lower()
        if 'kadıköy' in op or 'kadikoy' in op:
            d = 'kadikoy'
        u = pick_unit(d, ev.branch)
        ev.org_unit_id = u.pk
        ev.save(update_fields=['org_unit'])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('chpist', '0002_add_planned_description'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Commission',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                ('name', models.CharField(max_length=200)),
                ('slug', models.SlugField(max_length=64, unique=True)),
                ('active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='GeographicNode',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'level',
                    models.CharField(
                        choices=[
                            ('il', 'İl'),
                            ('secim_bolgesi', 'Seçim Bölgesi'),
                            ('ilce', 'İlçe'),
                            ('mahalle', 'Mahalle'),
                        ],
                        db_index=True,
                        max_length=20,
                    ),
                ),
                ('name', models.CharField(max_length=200)),
                (
                    'code',
                    models.SlugField(
                        help_text='Benzersiz kod (akış filtresi, API).',
                        max_length=64,
                        unique=True,
                    ),
                ),
                (
                    'parent',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='children',
                        to='chpist.geographicnode',
                    ),
                ),
            ],
            options={
                'ordering': ['code'],
            },
        ),
        migrations.CreateModel(
            name='OrgUnit',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'branch',
                    models.CharField(
                        choices=[
                            ('ana_kademe', 'Ana Kademe'),
                            ('genclik', 'Gençlik Kolları'),
                            ('kadin', 'Kadın Kolları'),
                            ('komisyon', 'Komisyon'),
                        ],
                        db_index=True,
                        max_length=32,
                    ),
                ),
                (
                    'ilce_code',
                    models.CharField(
                        blank=True,
                        db_index=True,
                        help_text='Denormalize: bağlı coğrafyanın ilçe kodu (filtre).',
                        max_length=64,
                    ),
                ),
                (
                    'commission',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='org_units',
                        to='chpist.commission',
                    ),
                ),
                (
                    'geographic_node',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='org_units',
                        to='chpist.geographicnode',
                    ),
                ),
            ],
            options={
                'constraints': [
                    models.UniqueConstraint(
                        fields=('geographic_node', 'branch', 'commission'),
                        name='uniq_org_unit_geo_branch_commission',
                    ),
                ],
            },
        ),
        migrations.AddField(
            model_name='post',
            name='org_unit',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='posts',
                to='chpist.orgunit',
            ),
        ),
        migrations.AddField(
            model_name='plannedevent',
            name='org_unit',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='planned_events',
                to='chpist.orgunit',
            ),
        ),
        migrations.RunPython(seed_and_backfill, noop_reverse),
        migrations.RemoveField(model_name='post', name='district_id'),
        migrations.RemoveField(model_name='post', name='branch'),
        migrations.RemoveField(model_name='post', name='org_path'),
        migrations.RemoveField(model_name='plannedevent', name='branch'),
        migrations.RemoveField(model_name='plannedevent', name='org_path'),
        migrations.AlterField(
            model_name='post',
            name='org_unit',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='posts',
                to='chpist.orgunit',
            ),
        ),
        migrations.AlterField(
            model_name='plannedevent',
            name='org_unit',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='planned_events',
                to='chpist.orgunit',
            ),
        ),
    ]
