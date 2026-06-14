# TagIT Auth Testing Playbook

Two auth paths converge on the same JWT cookie session:

1. Password auth — `/api/auth/register`, `/api/auth/login`
2. Emergent Google auth — frontend redirects to `auth.emergentagent.com`, lands on `/auth/callback#session_id=...`, calls `POST /api/auth/google/session` with `{ session_id }` to issue cookies.

## Step 1 — MongoDB sanity
```
mongosh
use test_database
db.users.findOne({ email: "anand@tagit.in" })
db.users.getIndexes()        // expect unique on email
db.tags.getIndexes()         // expect unique on slug
```
Expect bcrypt hash starting with `$2b$` for the seeded admin.

## Step 2 — Password auth (cURL)
```
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
curl -c /tmp/c.txt -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"anand@tagit.in","password":"TagITAdmin@2026"}'
curl -b /tmp/c.txt "$API/api/auth/me"
curl -b /tmp/c.txt "$API/api/tags"           # should list demo tags
```
Expect 200 with the user object and the seeded vehicle/pet/medical tags.

## Step 3 — Public / Finder flow
```
SLUG=$(curl -b /tmp/c.txt "$API/api/tags" | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['slug'])")
curl "$API/api/public/tags/$SLUG"
curl -X POST "$API/api/public/tags/$SLUG/messages" \
  -H "Content-Type: application/json" \
  -d '{"action_type":"wrong_parking","body":"You parked across two slots."}'
curl -b /tmp/c.txt "$API/api/inbox"          # should now contain the finder message
```

## Step 4 — Medical emergency view
Look up the seeded medical tag (`type:"medical"`) and ensure the public response includes the `emergency` block with `blood_group:"O+"`, `emergency_contact_phone:"+91 89042 23100"` and a `last_updated` timestamp.

## Step 5 — Google session (Emergent Auth)
1. Open `<frontend>/login` and click "Continue with Google".
2. After Google completes, the URL becomes `<frontend>/auth/callback#session_id=...`.
3. AuthCallback POSTs `{ session_id }` to `/api/auth/google/session` and gets cookies back.
4. Verify a fresh user is created (or merged on email match) and `/api/auth/me` returns the same user.

## Failure indicators
- 401 on `/api/auth/me` after login → cookie `samesite=None; secure=True` likely lost; verify HTTPS + CORS allow_credentials.
- Slug not found on a freshly created tag → make sure the slug index didn't collide; check `db.tags.findOne({ slug: '<slug>' })`.
- Medical fields missing on public view → check that `emergency_mode` AND `consent_given` are both true on the profile.
