# Supabase Rules

## General
- Supabase is the primary backend source.

## Assets
- Vocabulary assets should preferably live in Supabase Storage.
- Local assets should only contain essential fallback resources.

## Database
- Every schema change requires:
  - SQL migration
  - compatibility verification
  - updated types/interfaces if needed

## Queries
- Avoid duplicating Supabase queries across the app.
- Centralize database access in infrastructure repositories.