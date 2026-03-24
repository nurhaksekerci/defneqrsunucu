from rest_framework import serializers

from .models import District, Hat


class HatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hat
        fields = ("id", "code", "name", "coordination_bucket", "coordination_line")


class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ("id", "name", "election_zone")
