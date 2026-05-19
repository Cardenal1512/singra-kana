# Architecture Rules

## General Architecture

- The whole project must follow Hexagonal Architecture.
- The separation between `domain`, `application` and `infrastructure` must be respected strictly.
- Avoid mixing UI, business logic, persistence logic or external service logic in the same layer.
- New features must be implemented in small, modular pieces.
- Avoid large refactors unless explicitly requested.

## Layers

### Domain

- Contains the core business concepts, entities, value objects and domain rules.
- Must not depend on infrastructure, UI frameworks, Supabase, Expo, React Native or external APIs.
- Domain code should be pure whenever possible.

### Application

- Contains use cases and orchestration logic.
- Coordinates domain logic through ports/interfaces.
- Must not directly depend on concrete infrastructure implementations.
- Should expose clear use cases that can be called from screens or controllers.

### Infrastructure

- Contains external implementations:
  - Supabase access
  - asset loading
  - API clients
  - storage adapters
  - repositories
  - platform-specific integrations
- Infrastructure must implement ports defined by the application/domain layers.
- Infrastructure details must not leak into domain models.

## Database and Supabase

- Any model or database change must be reflected in a Supabase SQL script.
- If an existing SQL script already supports the new change, this must be explicitly verified.
- Database changes must be incremental and traceable.
- Avoid changing the data model without updating the corresponding Supabase migration/script.
- Keep Supabase-specific logic inside infrastructure.

## Platform Priority

- The app must prioritize correct behavior and layout in this order:
  1. iPhone
  2. iPad
  3. PC / web
  4. Android
- Mobile-first design is mandatory.
- Avoid layouts that work only on desktop.
- iPhone usability takes priority over desktop aesthetics.

## Assets

- Dynamic and vocabulary-related assets should be loaded from Supabase whenever possible.
- Only essential app assets should live inside the local `assets` folder.
- Essential assets may include:
  - core Singra images
  - app icons
  - splash assets
  - fallback images
  - assets required before Supabase is available
- Avoid adding large non-essential assets to the local bundle.

## Constants and Hardcoded Values

- Avoid hardcoded strings, kana, labels, paths, magic numbers, colors or configuration values directly in components or use cases.
- Use constants files for reusable values.
- Prefer centralized configuration files for:
  - routes
  - labels
  - kana series
  - asset paths
  - colors
  - spacing
  - validation rules
  - feature flags
- User-facing text should be centralized to make future localization easier.

## UI and Screens

- Screens should orchestrate state and rendering only.
- Business logic must not live directly inside screens.
- Validation logic should be extracted to application/domain services or reusable utilities.
- Reusable UI blocks should be extracted into components.
- Keep screens readable and focused.

## Compatibility

- Existing functionality must not be broken.
- Changes should be incremental.
- When modifying shared behavior, verify affected modes/screens.
- Existing assets, vocabulary entries and learning modes should remain compatible unless the task explicitly requires a breaking change.

## Testing

- Add or update tests when the project already has tests for the affected area.
- Prefer testing use cases, domain logic and mappers before UI details.
- Keep tests close to the behavior being changed.

## Code Style
- Prefer readable code.
- Avoid giant files.
- Use constants instead of hardcoded values.
- Use English naming.
- Reuse components and utilities.