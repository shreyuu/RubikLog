from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
import sys
import os


# Valid Rubik's cube moves for validation
VALID_MOVES = frozenset(
    [
        "R",
        "L",
        "U",
        "D",
        "F",
        "B",
        "R'",
        "L'",
        "U'",
        "D'",
        "F'",
        "B'",
        "R2",
        "L2",
        "U2",
        "D2",
        "F2",
        "B2",
        "M",
        "M'",
        "M2",
        "E",
        "E'",
        "E2",
        "S",
        "S'",
        "S2",  # Middle layer moves
        "x",
        "x'",
        "x2",
        "y",
        "y'",
        "y2",
        "z",
        "z'",
        "z2",  # Rotations
    ]
)


class CubeType(models.Model):
    name = models.CharField(max_length=50)  # e.g., "3x3", "4x4", "Pyraminx"
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Solve(models.Model):
    time_taken = models.FloatField(
        db_index=True, help_text="Time taken to solve the cube in seconds"
    )
    scramble = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="Scramble sequence used for this solve",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, db_index=True, help_text="When this solve was recorded"
    )
    note = models.TextField(
        blank=True, max_length=500, help_text="Optional notes about this solve"
    )
    cube_type = models.ForeignKey(
        CubeType, on_delete=models.CASCADE, related_name="solves"
    )
    is_pb = models.BooleanField(default=False)
    tags = models.CharField(max_length=255, blank=True)  # Comma-separated tags
    session = models.CharField(max_length=100, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["time_taken"]),
            models.Index(
                fields=["created_at", "time_taken"]
            ),  # Composite index for ordering
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.time_taken}s - {self.created_at.strftime('%d %b %Y %H:%M:%S')}"

    def clean(self):
        # Validate time_taken
        if self.time_taken is not None:
            if self.time_taken <= 0:
                raise ValidationError("Time taken must be positive")
            if self.time_taken > 3600:
                raise ValidationError("Time taken cannot exceed 1 hour")

        # Skip validation when explicitly disabled for tests
        skip_validation = os.environ.get("SKIP_SCRAMBLE_VALIDATION", "False") == "True"
        if "test" in sys.argv and skip_validation:
            return

        # Validate scramble
        if self.scramble:
            moves = self.scramble.strip().split()
            invalid_moves = [move for move in moves if move not in VALID_MOVES]
            if invalid_moves:
                raise ValidationError(
                    f"Invalid scramble notation. Invalid moves: {', '.join(invalid_moves)}"
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def formatted_time(self):
        """Return formatted time string"""
        if self.time_taken < 60:
            return f"{self.time_taken:.2f}s"
        elif self.time_taken < 3600:
            minutes = int(self.time_taken // 60)
            seconds = self.time_taken % 60
            return f"{minutes}:{seconds:05.2f}"
        else:
            hours = int(self.time_taken // 3600)
            minutes = int((self.time_taken % 3600) // 60)
            seconds = self.time_taken % 60
            return f"{hours}:{minutes:02d}:{seconds:05.2f}"
