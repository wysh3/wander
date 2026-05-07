"""Initial schema — all 9 tables

Revision ID: 20240601_initial
Revises:
Create Date: 2024-06-01
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

revision: str = "20240601_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("supabase_uid", sa.String(255), unique=True, nullable=False),
        sa.Column("phone", sa.String(15), unique=True, nullable=False),
        sa.Column("name", sa.String(100)),
        sa.Column("email", sa.String(255)),
        sa.Column("date_of_birth", sa.Date),
        sa.Column("gender", sa.String(20)),
        sa.Column("verification_method", sa.String(20)),
        sa.Column("verification_status", sa.String(20), server_default="unverified"),
        sa.Column("verified_at", sa.DateTime(timezone=True)),
        sa.Column("digilocker_ref", sa.String(255)),
        sa.Column("aadhaar_hashed", sa.String(255)),
        sa.Column("personality_vector", Vector(5), nullable=True),
        sa.Column("personality_raw", postgresql.JSONB),
        sa.Column("interests", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("activity_preferences", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("vibe", sa.String(50)),
        sa.Column("availability", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("onboarding_completed", sa.Boolean, server_default=sa.text("false")),
        sa.Column("onboarding_chat_log", postgresql.JSONB),
        sa.Column("home_lat", sa.Numeric(10, 7)),
        sa.Column("home_lng", sa.Numeric(10, 7)),
        sa.Column("home_area", sa.String(100)),
        sa.Column("city", sa.String(50), server_default="Bangalore"),
        sa.Column("travel_radius_km", sa.Integer, server_default="15"),
        sa.Column("emergency_contact_name", sa.String(100)),
        sa.Column("emergency_contact_phone", sa.String(15)),
        sa.Column("women_only_preference", sa.Boolean, server_default=sa.text("false")),
        sa.Column("streak_weeks", sa.Integer, server_default="0"),
        sa.Column("total_experiences", sa.Integer, server_default="0"),
        sa.Column("total_people_met", sa.Integer, server_default="0"),
        sa.Column("total_neighborhoods_explored", sa.Integer, server_default="0"),
        sa.Column("screen_time_before", sa.Integer),
        sa.Column("screen_time_after", sa.Integer),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_users_city", "users", ["city"])
    op.create_index("idx_users_verification_status", "users", ["verification_status"])
    op.create_index("idx_users_onboarding_completed", "users", ["onboarding_completed"])

    op.create_table(
        "venues",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("address", sa.Text),
        sa.Column("lat", sa.Numeric(10, 7)),
        sa.Column("lng", sa.Numeric(10, 7)),
        sa.Column("area", sa.String(100)),
        sa.Column("city", sa.String(50), server_default="Bangalore"),
        sa.Column("venue_type", sa.String(50)),
        sa.Column("wander_verified", sa.Boolean, server_default=sa.text("false")),
        sa.Column("capacity", sa.Integer),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_venues_city_area", "venues", ["city", "area"])

    op.create_table(
        "activities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("category", sa.String(50)),
        sa.Column("activity_type", sa.String(100)),
        sa.Column("venue_id", postgresql.UUID(as_uuid=True)),
        sa.Column("lat", sa.Numeric(10, 7)),
        sa.Column("lng", sa.Numeric(10, 7)),
        sa.Column("area", sa.String(100)),
        sa.Column("city", sa.String(50), server_default="Bangalore"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True)),
        sa.Column("duration_minutes", sa.Integer, server_default="180"),
        sa.Column("group_size_min", sa.Integer, server_default="4"),
        sa.Column("group_size_max", sa.Integer, server_default="8"),
        sa.Column("women_only", sa.Boolean, server_default=sa.text("false")),
        sa.Column("max_groups", sa.Integer, server_default="3"),
        sa.Column("host_ids", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), server_default="{}"),
        sa.Column("phone_free_encouraged", sa.Boolean, server_default=sa.text("true")),
        sa.Column("status", sa.String(20), server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_activities_city", "activities", ["city"])
    op.create_index("idx_activities_area", "activities", ["area"])
    op.create_index("idx_activities_category", "activities", ["category"])
    op.create_index("idx_activities_scheduled_at", "activities", ["scheduled_at"])
    op.create_index("idx_activities_status", "activities", ["status"])
    op.create_foreign_key("fk_activities_venue", "activities", "venues", ["venue_id"], ["id"])

    op.create_table(
        "groups",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("activity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("host_id", postgresql.UUID(as_uuid=True)),
        sa.Column("match_score", sa.Numeric(5, 3)),
        sa.Column("no_show_risk", sa.Numeric(4, 3)),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("chat_opens_at", sa.DateTime(timezone=True)),
        sa.Column("chat_expires_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_groups_activity_id", "groups", ["activity_id"])
    op.create_index("idx_groups_status", "groups", ["status"])
    op.create_index("idx_groups_chat_expires", "groups", ["chat_expires_at"])
    op.create_foreign_key("fk_groups_activity", "groups", "activities", ["activity_id"], ["id"])
    op.create_foreign_key("fk_groups_host", "groups", "users", ["host_id"], ["id"])

    op.create_table(
        "group_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("group_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(20), server_default="member"),
        sa.Column("checked_in", sa.Boolean, server_default=sa.text("false")),
        sa.Column("sos_triggered", sa.Boolean, server_default=sa.text("false")),
        sa.Column("rating", sa.Integer),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("group_id", "user_id"),
    )
    op.create_index("idx_group_members_user", "group_members", ["user_id"])
    op.create_index("idx_group_members_group", "group_members", ["group_id"])
    op.create_foreign_key("fk_group_members_group", "group_members", "groups", ["group_id"], ["id"])
    op.create_foreign_key("fk_group_members_user", "group_members", "users", ["user_id"], ["id"])

    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("group_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True)),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("message_type", sa.String(20), server_default="text"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_chat_messages_group", "chat_messages", ["group_id", "created_at"])
    op.create_index("idx_chat_messages_expires", "chat_messages", ["expires_at"])
    op.create_foreign_key("fk_chat_messages_group", "chat_messages", "groups", ["group_id"], ["id"])
    op.create_foreign_key("fk_chat_messages_user", "chat_messages", "users", ["user_id"], ["id"])

    op.create_table(
        "sos_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("group_id", postgresql.UUID(as_uuid=True)),
        sa.Column("activity_id", postgresql.UUID(as_uuid=True)),
        sa.Column("lat", sa.Numeric(10, 7)),
        sa.Column("lng", sa.Numeric(10, 7)),
        sa.Column("emergency_contact_notified", sa.Boolean, server_default=sa.text("false")),
        sa.Column("nearest_police_station", sa.String(200)),
        sa.Column("resolved", sa.Boolean, server_default=sa.text("false")),
        sa.Column("triggered_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_sos_user", "sos_events", ["user_id"])
    op.create_index("idx_sos_triggered_at", "sos_events", ["triggered_at"])
    op.create_foreign_key("fk_sos_user", "sos_events", "users", ["user_id"], ["id"])
    op.create_foreign_key("fk_sos_group", "sos_events", "groups", ["group_id"], ["id"])
    op.create_foreign_key("fk_sos_activity", "sos_events", "activities", ["activity_id"], ["id"])

    op.create_table(
        "hosts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), unique=True, nullable=False),
        sa.Column("total_experiences_hosted", sa.Integer, server_default="0"),
        sa.Column("rating_avg", sa.Numeric(3, 2)),
        sa.Column("background_verified", sa.Boolean, server_default=sa.text("false")),
        sa.Column("interview_completed", sa.Boolean, server_default=sa.text("false")),
        sa.Column("active", sa.Boolean, server_default=sa.text("true")),
        sa.Column("specialties", postgresql.ARRAY(sa.String), server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_foreign_key("fk_hosts_user", "hosts", "users", ["user_id"], ["id"])

    op.create_table(
        "user_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("other_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("activity_id", postgresql.UUID(as_uuid=True)),
        sa.Column("group_id", postgresql.UUID(as_uuid=True)),
        sa.Column("met_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "other_user_id", "activity_id"),
    )
    op.create_index("idx_user_history_user", "user_history", ["user_id"])
    op.create_index("idx_user_history_pair", "user_history", ["user_id", "other_user_id"])
    op.create_index("idx_user_history_met_at", "user_history", ["met_at"])
    op.create_foreign_key("fk_user_history_user", "user_history", "users", ["user_id"], ["id"])
    op.create_foreign_key("fk_user_history_other", "user_history", "users", ["other_user_id"], ["id"])
    op.create_foreign_key("fk_user_history_activity", "user_history", "activities", ["activity_id"], ["id"])
    op.create_foreign_key("fk_user_history_group", "user_history", "groups", ["group_id"], ["id"])


def downgrade() -> None:
    op.drop_table("user_history")
    op.drop_table("hosts")
    op.drop_table("sos_events")
    op.drop_table("chat_messages")
    op.drop_table("group_members")
    op.drop_table("groups")
    op.drop_table("activities")
    op.drop_table("venues")
    op.drop_table("users")
