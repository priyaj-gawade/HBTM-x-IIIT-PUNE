# Oreo Platform - Frontend / Backend API Contract

This document provides a comprehensive mapping of the API endpoints used in the original Flutter application and how they translate to the new Next.js architecture. 

It is designed to serve as a reference for backend engineers connecting the Next.js frontend to the existing Spring Boot backend.

## 1. Base Configuration

- **Old Flutter Base URL:** `http://localhost:8080/api` (Configured in `api_client.dart`)
- **Next.js Strategy:** The Next.js app should configure a `NEXT_PUBLIC_API_URL` environment variable. API calls can be handled via Next.js Server Actions or Route Handlers (for secure server-to-server communication) or directly via `fetch` from client components using this base URL.

---

## 2. Knowledge Hub (Course Catalog)

In the Flutter app, this was managed by `HttpCourseCatalogRepository`.

### Endpoints
- `GET /catalog/all`
  - **Purpose:** Fetch all available courses.
  - **Response:** Array of `CourseCatalogEntry` DTOs.
- `GET /catalog/recommendations?domain={domain}`
  - **Purpose:** Fetch recommended courses, optionally filtered by domain.
  - **Response:** Array of `CourseCatalogEntry` DTOs.
- `GET /catalog/search?query={query}`
  - **Purpose:** Perform a keyword search on the catalog.
  - **Response:** Array of `CourseCatalogEntry` DTOs.

### DTO: `CourseCatalogEntry`
```typescript
interface CourseCatalogEntry {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Expert' | 'Hard';
  tags: string[];
  estimatedHours: number;
  thumbnailUrl: string;
}
```

---

## 3. Workspaces & Mind Maps

In the Flutter app, this was managed by `HttpWorkspaceRepository`.

### Endpoints
- `GET /workspaces`
  - **Purpose:** Fetch all workspaces for the logged-in user.
- `GET /workspaces/{id}`
  - **Purpose:** Fetch details of a specific workspace.
- `POST /workspaces`
  - **Purpose:** Create a new workspace manually.
- `PUT /workspaces/{id}`
  - **Purpose:** Update workspace metadata.
- `POST /v1/mindmap/generate`
  - **Purpose:** The core AI generation endpoint. Takes a subject and persona, returning a deeply nested MindMap/SubjectCluster.
  - **Payload:** `{ "subjectTitle": "Course Name", "persona": "Visual learner" }`
  - **Response:** A `SubjectCluster` JSON object containing the root node and recursive children, which is then parsed into the visual roadmap.
- `GET /search/videos?workspaceId={id}&topic={topic}&context={context}`
  - **Purpose:** Search for YouTube videos relevant to a specific node/topic in the mind map.

---

## 4. Flashcards & Lab (Orchestration)

In the Flutter app, this was managed by `HttpFlashcardRepository` and `HttpWorkspaceRepository`.

### Endpoints
- `POST /orchestration/generate-flashcards`
  - **Purpose:** Generate flashcards based on a topic using AI.
  - **Payload:** `{ "topic": "Course Name" }`
  - **Response:** Array of Flashcard JSON objects.

### DTO: `FlashcardItem`
```typescript
interface FlashcardItem {
  id: string;
  frontQuestion: string; // Mapped to 'front' in frontend
  backAnswer: string;    // Mapped to 'back' in frontend
  topicTag: string;
}
```

---

## 5. Next.js Integration Strategy

When connecting the new Next.js components to these endpoints, follow these patterns:

1. **Static/Initial Data Loading:** For fetching the Knowledge Hub catalog (`/catalog/all`), use Next.js React Server Components (RSC) to `fetch` the data on the server during rendering. This provides immediate HTML delivery and SEO benefits.
2. **Client-Side Interactions:** For dynamic interactions like searching (`/catalog/search?query=x`) or AI generations (`/v1/mindmap/generate`), use Client Components with React hooks (like `useEffect` or `useSWR`), or Server Actions for form submissions.
3. **Data Parity:** The mock data structures defined in `src/lib/mock-data.ts` inside the Next.js app perfectly mirror the expected DTOs defined above. As the backend endpoints are connected, you can simply replace the static imports of `MOCK_HUB_COURSES`, `MOCK_ROADMAP`, etc., with the live JSON responses.
