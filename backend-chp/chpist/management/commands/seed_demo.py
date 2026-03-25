import urllib.request
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework.authtoken.models import Token

from chpist.models import (
    BranchKind,
    MembershipRole,
    Notification,
    OrgMembership,
    OrgUnit,
    PlannedEvent,
    PlannedEventStatus,
    Post,
    PostImage,
)


def _fetch_image(url: str, filename: str) -> ContentFile:
    with urllib.request.urlopen(url, timeout=30) as r:
        return ContentFile(r.read(), name=filename)


class Command(BaseCommand):
    help = 'Örnek kullanıcı, gönderi ve planlanan etkinlik oluşturur (geliştirme).'

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            username='demo',
            defaults={'email': 'demo@chp.local', 'first_name': 'Demo', 'last_name': 'Kullanıcı'},
        )
        user.set_password('demo12345')
        user.save()
        Token.objects.get_or_create(user=user)
        self.stdout.write(self.style.SUCCESS(f'Kullanıcı demo / demo12345 (oluşturuldu={created})'))

        now = timezone.now()

        ou_z_ana = OrgUnit.objects.filter(
            geographic_node__code='zeytinburnu',
            branch=BranchKind.ANA_KADEME,
            commission__isnull=True,
        ).first()
        if not ou_z_ana:
            self.stdout.write(
                self.style.WARNING(
                    'Org birimi bulunamadı (migration 0003 çalıştırılmalı). Gönderi atlandı.'
                )
            )
            ou_z_ana = None

        if ou_z_ana is not None:
            OrgMembership.objects.get_or_create(
                user=user,
                org_unit=ou_z_ana,
                defaults={
                    'role': MembershipRole.DELEGATE,
                    'title': 'İlçe yöneticisi (örnek)',
                    'is_primary': True,
                },
            )

        if not Post.objects.exists() and ou_z_ana is not None:
            p1 = Post.objects.create(
                author=user,
                author_label='Zeytinburnu İlçe Başkanlığı',
                org_unit=ou_z_ana,
                event_title='Mahalle buluşması',
                event_description='Yerel örgütlenme ve dayanışma buluşması.',
                caption='Mahalle buluşmamızdan kareler. Birlikte daha güçlüyüz.',
                event_category_id='mahalle_saha',
                like_count=128,
                created_at=now - timedelta(hours=2),
            )
            img_url = (
                'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80'
            )
            try:
                cf = _fetch_image(img_url, 'zeytinburnu.jpg')
                PostImage.objects.create(post=p1, image=cf, sort_order=0)
            except OSError as e:
                self.stdout.write(self.style.WARNING(f'Görsel indirilemedi: {e}'))
        else:
            self.stdout.write('Gönderi örneği zaten mevcut.')

        if ou_z_ana is not None:
            PlannedEvent.objects.get_or_create(
                title='Nuripaşa Mahalle ziyareti',
                defaults={
                    'created_by': user,
                    'org_unit': ou_z_ana,
                    'start_at': now + timedelta(days=4),
                    'location': 'Nuripaşa Muhtarlığı önü',
                    'event_category_id': 'mahalle_saha',
                    'status': PlannedEventStatus.PLANNED,
                },
            )

        Notification.objects.get_or_create(
            user=user,
            title='Hoş geldiniz',
            defaults={
                'body': 'CHP İstanbul uygulamasına giriş yaptınız.',
                'read': False,
            },
        )

        self.stdout.write(self.style.SUCCESS('Örnek veri hazır.'))
