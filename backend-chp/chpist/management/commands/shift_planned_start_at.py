from __future__ import annotations

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from chpist.models import PlannedEvent


class Command(BaseCommand):
    help = (
        "Shift PlannedEvent.start_at by N hours. "
        "Use --apply to write changes, otherwise dry-run."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--hours",
            type=int,
            default=3,
            help="Hours to add/subtract. Example: 3 or -3.",
        )
        parser.add_argument(
            "--status",
            default="all",
            choices=["all", "planned", "completed"],
            help="Filter by PlannedEvent.status.",
        )
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Apply update. Without this flag only dry-run output is produced.",
        )

    def handle(self, *args, **options):
        hours = int(options["hours"])
        status = options["status"]
        apply = bool(options["apply"])

        qs = PlannedEvent.objects.all().order_by("id")
        if status != "all":
            qs = qs.filter(status=status)

        total = qs.count()
        if total == 0:
            self.stdout.write(self.style.WARNING("No matching planned events found."))
            return

        delta = timedelta(hours=hours)
        self.stdout.write(
            f"Matched rows: {total}. Shift: {hours:+} hours. Apply: {apply}."
        )

        sample = list(qs.values("id", "title", "start_at")[:10])
        for row in sample:
            before = row["start_at"]
            after = before + delta
            self.stdout.write(
                f"  id={row['id']} title={row['title']!r}  {before} -> {after}"
            )
        if total > len(sample):
            self.stdout.write(f"  ... and {total - len(sample)} more rows")

        if not apply:
            self.stdout.write(
                self.style.WARNING(
                    "Dry-run only. Re-run with --apply to write updates."
                )
            )
            return

        with transaction.atomic():
            for ev in qs.iterator(chunk_size=500):
                ev.start_at = ev.start_at + delta
                ev.save(update_fields=["start_at"])

        self.stdout.write(self.style.SUCCESS(f"Updated {total} planned events."))
