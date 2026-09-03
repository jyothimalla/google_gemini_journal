# Gemini Reflection Journal & Summarizer

A production-ready, user-authenticated multi-turn reflection journal and conversational summarizer powered by **Google Gemini 3.6 Flash API**, **Firebase Authentication (Google Sign-In)**, and **Cloud Firestore** with strict per-user data isolation and OWASP Top 10 security compliance.

---

## 🏛️ System Architecture

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Secure federated login via Google Sign-In with zero password storage. |
| **Backend Database** | Cloud Firestore | Isolated document storage for multi-turn chats & journal reflections under `/users/{userId}/interactions/{interactionId}`. |
| **AI Engine** | Gemini 3.6 Flash API | Generates multi-turn insights, reflections, action steps, and summaries via server-side `@google/genai` with 4-model fallback ladder. |
| **Secret Management** | Secret Manager / Env Vars | Securely injects `GEMINI_API_KEY` without exposing keys to the browser. |
| **Application Host** | Google Cloud Run | Scalable, containerized full-stack Express + React application. |

---

## 🛡️ Firestore Security Rules

Deploy the following owner-bound security rules to ensure zero cross-user access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🔑 Secret Manager Setup

Store your Gemini API key in Google Cloud Secret Manager and grant Cloud Run access:

```bash
# 1. Create and populate the secret in Google Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run runtime service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Google Cloud Run Deployment

### 1. Build and Deploy to Cloud Run

```bash
gcloud run deploy gemini-reflection-journal \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### 2. Campaign Verification Binding

Apply the mandatory verification label to register your Cloud Run deployment:

```bash
gcloud run services update gemini-reflection-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file from `.env.example`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   ```

3. **Start unified dev server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
