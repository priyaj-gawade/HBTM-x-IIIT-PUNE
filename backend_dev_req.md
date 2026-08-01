I reviewed your frontend research report. It strongly aligns with a **rapid AI-first development workflow using Antigravity IDE**—specifically recommending **Next.js App Router + shadcn/ui + Tailwind + copy-paste component libraries** to maximize AI-assisted coding speed. 

Given your **16-hour limit**, I would optimize for **demo quality + smooth frontend/backend integration**, not feature completeness.

# Final Architecture

```text
                    GrowthPilot AI

                   Next.js 15 Frontend
                (App Router + Tailwind)

                        │
          REST APIs (FastAPI + JSON)

                        │

                FastAPI Backend (Python)

                        │

       PostgreSQL + pgvector + SQLAlchemy

                        │

          Gemini / OpenAI Agent Orchestrator

                        │

         Long-term Memory + Resource Engine
```

---

# Tech Stack

## Frontend

Based on your report:

* Next.js 15 (App Router)
* React
* Tailwind CSS
* shadcn/ui
* Aceternity UI (Hero only)
* Magic UI (loading/animations only)
* Zustand
* TanStack Query
* Lucide Icons
* Framer Motion

Avoid MUI/Ant Design because Antigravity works best when component code is editable. 

---

## Backend

* FastAPI
* Python 3.12
* PostgreSQL
* pgvector
* SQLAlchemy
* Alembic
* Pydantic
* Redis (optional cache)
* Gemini API
* LangGraph (recommended) or CrewAI
* JWT Authentication

---

# Reduce AI Agents

Instead of 10 agents, build **4 real agents**.

```
Identity Agent

↓

Growth Planner

↓

Curator Agent

↓

Reflection Agent
```

Enough for judges.

---

# MVP Features

## Authentication

* Login
* Signup

---

## Onboarding

10–15 questions

Creates

```
Growth Blueprint
```

---

## Dashboard

Cards

* Today's Mission
* Growth Score
* AI Insights
* Progress
* Reflection
* Recommended Resources

---

## Curator

One button

```
Curate My Day
```

AI returns

* Video
* Article
* Book
* Podcast
* Challenge

with reasoning.

---

## Reflection

Night reflection

Updates profile

---

# Backend Folder Structure

```text
backend/

app/

    api/

        auth.py

        users.py

        onboarding.py

        dashboard.py

        curator.py

        reflection.py

        resources.py

    agents/

        identity_agent.py

        planner_agent.py

        curator_agent.py

        reflection_agent.py

    services/

    models/

    schemas/

    db/

    prompts/

    utils/

main.py
```

---

# PostgreSQL Schema

## users

```text
id

email

password_hash

created_at
```

---

## profiles

```text
id

user_id

goal

learning_style

experience

daily_time

motivation

current_level

updated_at
```

---

## habits

```text
id

user_id

habit_name

frequency

current_streak

completion_rate
```

---

## reflections

```text
id

user_id

mood

journal

summary

created_at
```

---

## curated_resources

```text
id

user_id

title

type

url

reason

created_at
```

---

## embeddings

(pgvector)

```text
id

user_id

content

embedding vector
```

Stores

* reflections
* goals
* conversations

---

# Backend API List

## Auth

### POST

```
/api/auth/signup
```

Request

```json
{
  "name":"",
  "email":"",
  "password":""
}
```

Response

```json
{
  "token":"",
  "user_id":""
}
```

---

### POST

```
/api/auth/login
```

---

### GET

```
/api/auth/me
```

---

# User Profile

## POST

```
/api/profile
```

Save onboarding.

---

## GET

```
/api/profile
```

Return Growth Blueprint.

---

## PATCH

```
/api/profile
```

Update profile.

---

# Dashboard

## GET

```
/api/dashboard
```

Returns

```json
{
 "growth_score":84,
 "today_focus":"Deep Work",
 "streak":11,
 "mission":{},
 "insights":[]
}
```

---

# Curator

## POST

```
/api/curator/generate
```

Input

```json
{
 "goal":"Become AI Engineer"
}
```

Output

```json
{
 "today_plan":{},
 "resources":[
   {
     "title":"",
     "type":"youtube",
     "reason":""
   }
 ]
}
```

---

# Reflection

## POST

```
/api/reflection
```

Request

```json
{
 "mood":"happy",
 "journal":"..."
}
```

Response

```json
{
 "summary":"",
 "next_day_focus":""
}
```

---

# Progress

## GET

```
/api/progress
```

Returns

```json
{
 "growth_score":82,
 "streak":14,
 "completed":8
}
```

---

# Resource Search

## GET

```
/api/resources
```

Filters

```
type

goal

difficulty
```

---

# AI Chat

## POST

```
/api/chat
```

Body

```json
{
 "message":"Help me stay consistent"
}
```

Returns

```json
{
 "reply":"..."
}
```

---

# Frontend Integration

## Folder Structure

```text
app/

(auth)

dashboard

profile

reflection

curator

components/

ui

cards

charts

layout

services/

api.ts

hooks/

useDashboard

useCurator

useReflection

store/

zustand
```

---

# API Service Layer

```typescript
services/

auth.service.ts

dashboard.service.ts

profile.service.ts

curator.service.ts

reflection.service.ts
```

Every page only calls services.

Never call fetch directly.

---

# Shared DTOs

Keep one contract.

Example

```typescript
interface CuratedResource{

id:string

title:string

type:string

reason:string

url:string
}
```

Backend

Pydantic

Frontend

TypeScript

Same fields.

---

# Agent Flow

```
Onboarding

↓

Identity Agent

↓

Growth Planner

↓

Curator Agent

↓

Dashboard

↓

Reflection

↓

Update Memory

↓

Tomorrow's Plan
```

---

# pgvector Usage

Store embeddings for:

* onboarding responses
* reflections
* goals
* chat history

When generating a plan:

1. Retrieve the user's most relevant memories using vector similarity.
2. Combine them with the current request.
3. Send the enriched context to the LLM.
4. Save the updated reflection back into pgvector.

This gives you persistent "growth memory" without building a complex knowledge graph.

---

# Antigravity Build Strategy

Based on your research report, the fastest approach is to let Antigravity generate and modify **raw component code** rather than relying on opaque npm UI libraries. Use **shadcn/ui** for all functional components and add only a few **Aceternity UI** sections (hero, spotlight, bento grid) for visual impact. This keeps the AI effective while still producing a polished demo. 

## Parallel Development Plan

**Frontend Team**

* Set up Next.js + Tailwind + shadcn
* Build all screens with mocked JSON
* Integrate TanStack Query
* Replace mock services with APIs as endpoints become available

**Backend Team**

* Create FastAPI project
* Define database schema
* Implement authentication
* Build endpoints in the order: Profile → Dashboard → Curator → Reflection
* Integrate Gemini and pgvector last

This contract-first approach allows both teams to work independently and then connect with minimal changes once the APIs are ready.
