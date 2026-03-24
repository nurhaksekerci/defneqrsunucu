from rest_framework import serializers

from .models import District, Hat


class HatSerializer(serializers.ModelSerializer):
    """Liste ve detay: özet sayıları annotate ile gelir."""

    event_count = serializers.IntegerField(read_only=True)
    profile_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Hat
        fields = (
            "id",
            "code",
            "name",
            "coordination_bucket",
            "coordination_line",
            "election_zone",
            "event_count",
            "profile_count",
        )


class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ("id", "name", "election_zone")
