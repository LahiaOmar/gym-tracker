# Gym Tracker — MVP Specification

## 1. Product Vision (MVP)

Build a mobile gym tracking app that:

* Works instantly without requiring account creation
* Allows fast session logging with minimal friction
* Tracks basic strength progression and training volume
* Is offline-first using SQLite
* Is architected to support future datasource changes safely

This document defines only the MVP scope.

---

# 2. Functional Scope

## 2.1 Session Logging

User can:

* Start a new workout session
* Select a training category
* Add exercises
* Add multiple sets per exercise
* Enter reps and weight per set
* Add optional notes per session

Optional per-exercise setup data:

* Machine name
* Seat height
* Bench angle
* Grip

Out of scope (post-MVP):

* Supersets
* Programs / routines
* Advanced analytics
* Social features

---

## 2.2 Training Categories

User can:

* Create custom categories (Push, Pull, Legs, Upper, Lower, etc.)
* Select category when starting a session

---

## 2.3 Exercise Library

* Built-in list of common exercises
* User can create custom exercises
* Basic name search

---

## 2.4 Basic Statistics

Per exercise:

* Personal Record (max weight)
* Best volume session

Global statistics:

* Total volume per week
* Total volume per month
* Number of sessions per week

All statistics are computed dynamically from stored sets.

---

# 3. User Model (MVP)

## 3.1 Default Guest User

* On first launch, app creates a local user automatically
* No login required
* User can edit profile later

### User Entity

* `id`
* `displayName` (default: "Guest")
* `weightUnit` (default: `kg`)
* `createdAt`
* `updatedAt`

---

# 4. Data Model (MVP)

## 4.1 TrainingCategory

* `id`
* `userId`
* `name`
* `createdAt`
* `updatedAt`

## 4.2 Exercise

* `id`
* `userId` (null if built-in)
* `name`
* `isBuiltIn`
* `createdAt`
* `updatedAt`

## 4.3 WorkoutSession

* `id`
* `userId`
* `categoryId`
* `startedAt`
* `endedAt`
* `notes` (optional)
* `createdAt`
* `updatedAt`

## 4.4 WorkoutExercise

* `id`
* `sessionId`
* `exerciseId`
* `order`
* `machineName` (optional)
* `seatHeight` (optional)
* `benchAngleDeg` (optional)
* `grip` (optional)

## 4.5 WorkoutSet

* `id`
* `workoutExerciseId`
* `order`
* `reps`
* `weight`
* `createdAt`
* `updatedAt`

Derived metric:

* `volume = reps × weight`

---

# 5. Core Relationships

* User

  * has many TrainingCategory
  * has many WorkoutSession
  * has many custom Exercise

* WorkoutSession

  * has many WorkoutExercise

* WorkoutExercise

  * has many WorkoutSet

---

# 6. Storage Architecture (MVP)

## 6.1 Default Storage

* Storage engine: **SQLite**
* Offline-first mobile architecture

## 6.2 Architectural Requirement

The application must not depend directly on SQLite implementation details.

Use a Repository + Adapter pattern:

### Domain Layer

* Pure business logic
* No database code

### Repository Interfaces

Examples:

* `UserRepository`
* `ExerciseRepository`
* `TrainingCategoryRepository`
* `WorkoutSessionRepository`

Each repository exposes:

* `create(entity)`
* `update(id, patch)`
* `delete(id)`
* `getById(id)`
* `list(filter, sort, pagination)`

Additional queries for statistics:

* `listSessionsByDateRange(userId, from, to)`
* `listSetsByExercise(userId, exerciseId, from?, to?)`

### Adapter Implementation (MVP)

* `SqliteAdapter` (only implementation enabled in MVP)

The architecture must allow future adapters without changing domain logic.

---

# 7. Database Migration Strategy (Future-proofing)

If storage engine changes in the future:

## 7.1 Version Tracking

Store:

* `storageEngine`
* `schemaVersion`

## 7.2 Migration Flow

On first launch after update:

1. Detect existing storage (SQLite)
2. Export all domain data via repositories
3. Import into new storage adapter
4. Mark migration as complete only after success
5. Keep old database until migration confirmed

## 7.3 Crash Safety

* Use transactions/batch writes
* Backup SQLite file before migration (optional)
* Retry migration if interrupted

User experience:

* Transparent migration on update
* Optional “Upgrading your data…” screen if needed

---

# 8. Explicit MVP Boundaries

Not included in MVP:

* Authentication
* Cloud sync
* Multi-device sync
* Social features
* AI insights
* Advanced analytics
* Supersets / circuits
* Programs / routines

These may be considered in future phases.

---

# 9. User Workflow, UX & Screens (MVP)

## 9.1 UX Principles

* Extremely fast logging (few taps per set)
* Minimal cognitive load
* Large touch-friendly inputs (mobile-first)
* Clear hierarchy: Session → Exercise → Sets
* No unnecessary navigation during workout

---

# 9.2 Screen Architecture (MVP)

Bottom Tab Navigation (4 tabs):

1. Home
2. Session (active workout)
3. Stats
4. Profile

---

## 9.3 Home Screen

Purpose: Entry point + overview.

Content:

* "Start Workout" primary button
* Quick summary card:

  * Last session date
  * Last category
* This week summary:

  * Sessions count
  * Total volume

Actions:

* Tap "Start Workout" → opens New Session flow
* Tap previous session → opens session details (read-only)

---

## 9.4 New Session Flow

Step 1: Select Category

* List of user categories
* Option to create new category inline

Step 2: Session Created

* Session timer starts automatically
* User enters Session Screen (active workout)

---

## 9.5 Active Session Screen

This is the most important screen.

Layout:

* Header:

  * Category name
  * Running timer
  * "Finish" button

* Exercises list (vertical scroll)
  Each exercise block contains:

  * Exercise name
  * Set rows
  * "Add Set" button

Set row layout:

* Set number
* Reps input
* Weight input

Quick UX features:

* Auto-fill last session weight
* "Duplicate last set" button
* Numeric keypad for fast entry
* Swipe to delete set

Add Exercise flow:

* Search input
* Built-in exercises
* Create custom exercise option

Finish Session:

* Confirmation modal
* Optional session notes
* Save → go to summary screen

---

## 9.6 Session Summary Screen

Shown after finishing workout.

Displays:

* Total duration
* Total volume
* PR achieved (if any)
* List of exercises performed

CTA:

* "Done" → back to Home

---

## 9.7 Stats Screen

Purpose: Basic progress visualization.

Sections:

1. Global Stats

* This week volume
* This month volume
* Sessions per week

2. Exercise Stats

* Search exercise
* Show:

  * Max weight
  * Best volume session

Future-ready but not in MVP:

* Graphs
* Trend analysis

---

## 9.8 Profile Screen

Simple MVP profile:

Fields:

* Display name
* Weight unit (kg / lb)

Actions:

* Reset data (danger zone)

No authentication in MVP.

---

# 9.9 Complete User Flow (Happy Path)

1. User opens app → lands on Home
2. Taps "Start Workout"
3. Selects category
4. Logs exercises and sets
5. Taps "Finish"
6. Views summary
7. Returns to Home
8. Later checks Stats tab to see progress

This defines the full MVP user experience.
