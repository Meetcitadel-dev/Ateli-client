# Implementation Plan: Dual Auth, Admin Login, Onboarding & Profile Settings

## Overview
This plan covers:
1. **Login page**: Add "Admin? Click here" toggle for email-based login (`@ateli.co.in`)
2. **Admin auth**: Email + OTP (magic link) via Supabase for admins
3. **User auth**: Phone + OTP via Supabase for normal users (real auth, replace demo)
4. **Per-admin read receipts**: Each admin has independent message read status
5. **Onboarding name step**: After verifying OTP (phone or email), ask for name before showing app
6. **Profile settings**: Remove profile photo, add Save button, fix the modal
7. **Remove Signup page**: Merge into unified Login flow

---

## Phase 1: Supabase Configuration (Manual — Supabase Dashboard)

### 1A. Enable Phone Auth (Real OTP)
- Go to **Supabase Dashboard → Authentication → Providers → Phone**
- Enable Phone provider
- Choose an SMS provider (Twilio recommended):
  - Add **Twilio Account SID**, **Auth Token**, and **Messaging Service SID**
  - Or use Supabase's built-in test OTP for development (set test phone numbers in Auth settings)

### 1B. Enable Email Auth (Magic Link / OTP)
- Go to **Supabase Dashboard → Authentication → Providers → Email**
- Enable Email provider
- Enable **"Confirm email"** (magic link or OTP)
- Set **OTP** mode (email OTP, not magic link) so the UX is consistent:
  - Under Auth → Email Templates → "Magic Link", customize or
  - Use `signInWithOtp({ email })` which sends a 6-digit code by default

### 1C. Database: Per-Admin Read Receipts
Run this SQL migration in Supabase SQL Editor:

```sql
-- Replace boolean is_read with a JSONB array tracking per-user reads
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS read_by uuid[] DEFAULT '{}';

-- Backfill: if is_read was true, we can't recover who read it, so leave read_by empty
-- Optionally drop the old column later:
-- ALTER TABLE public.chat_messages DROP COLUMN IF EXISTS is_read;
```

### 1D. Database: Add `email` to profiles (already exists ✅)
The `profiles` table already has an `email` column — no migration needed.

### 1E. Database: Update handle_new_user trigger
```sql
-- Update the trigger to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
        NEW.email,
        NEW.phone,
        CASE 
            WHEN NEW.email IS NOT NULL AND NEW.email LIKE '%@ateli.co.in' 
            THEN 'admin'
            ELSE 'client'
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, profiles.phone);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 1F. Database: Update profiles RLS to allow admins to read all profiles
```sql
-- Admins need to see all profiles for team management
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (
    auth.uid() = id 
    OR EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);
```

---

## Phase 2: Auth Context Updates

### File: `src/contexts/AuthContext.tsx`

**Changes:**
1. **Add `loginWithEmail` method** — calls `supabase.auth.signInWithOtp({ email })`
2. **Add `verifyEmailOtp` method** — calls `supabase.auth.verifyOtp({ email, token, type: 'email' })`
3. **Add `needsOnboarding` state** — true if user profile has name = 'New User' or empty
4. **Add `completeOnboarding` method** — updates profile name and sets `needsOnboarding = false`
5. **Update `fetchAndSetProfile`** — check if name needs to be set, extract email from auth user
6. **Update `User` type** — ensure `email` is included

### File: `src/types/user.ts`

**Changes:**
- Make `email` required (not optional) — default to `''`
- Keep phone as required, default to `''`

```typescript
export interface User {
    id: string;
    name: string;
    phone: string;
    email: string;
    avatar?: string;
    role: 'user' | 'admin' | 'client' | 'vendor' | 'architect';
    walletBalance: number;
    notifications?: any[];
}
```

### File: `src/contexts/AuthContext.tsx` — Updated Interface

```typescript
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    needsOnboarding: boolean;
    login: (phone: string) => Promise<void>;           // Phone OTP
    loginWithEmail: (email: string) => Promise<void>;   // Email OTP
    verifyOtp: (phone: string, token: string) => Promise<void>;
    verifyEmailOtp: (email: string, token: string) => Promise<void>;
    signup: (name: string, phone: string) => Promise<void>;
    completeOnboarding: (name: string) => Promise<void>;
    logout: () => void;
    updateUserProfile: (updates: Partial<User>) => void;
}
```

---

## Phase 3: Login Page Redesign

### File: `src/pages/auth/Login.tsx`

**New flow (single unified page):**

```
Step 1: "Login to Ateli" 
  - Phone number input (default)
  - "Are you an admin? Login with email" link at bottom
  - Clicking it switches to email input (@ateli.co.in)
  - "Login with phone number" link to switch back

Step 2: OTP Verification
  - 6-digit OTP input (same for both phone and email)
  - "Change number/email" link
  - "Resend OTP" link

Step 3: Name Entry (if needsOnboarding = true)
  - "What's your name?" 
  - Full name input
  - "Continue" button → calls completeOnboarding(name) → redirects to /projects
```

**Key behaviors:**
- If user is **new** (first login), after OTP verification → show name step
- If user is **returning** (profile already has name), skip name step → go straight to /projects
- Admin emails must end with `@ateli.co.in` (validate on frontend)
- No separate signup page needed — login handles everything via OTP

### Delete: `src/pages/auth/Signup.tsx`
- Remove the signup page entirely
- Remove the `/signup` route from `App.tsx`
- The login flow handles both new and existing users

---

## Phase 4: ViewContext — Derive Admin from Auth

### File: `src/contexts/ViewContext.tsx`

**Changes:**
- Instead of a manual toggle, derive `isAdmin` from the user's actual role
- Admin users (role = 'admin') automatically get admin view
- Remove the toggle for non-admin users
- Keep ability for admin to switch between admin/user view for testing

```typescript
// Use auth user's role to determine admin status
const { user } = useAuth();
const isAdminUser = user?.role === 'admin';

// Admin can toggle between views, non-admin always sees user view
const [viewMode, setViewModeState] = useState<ViewMode>(
    isAdminUser ? 'admin' : 'user'
);
```

---

## Phase 5: Profile Settings Modal Updates

### File: `src/components/layout/Sidebar.tsx` (Profile Modal)

**Changes:**
1. **Remove** the Avatar + "Change Photo" button section (lines 288-294)
2. **Add Save button** — currently changes save on every keystroke via `updateUserProfile`; 
   instead, use local state and save on button click
3. **Show email for admin users** instead of phone number (or show both)
4. **Make phone/email read-only** (can't change login credentials from profile)

**New profile modal structure:**
```
Edit Profile
├── Name input (editable, local state)
├── Phone/Email (read-only, shown based on user type)
├── [Save Changes] button (primary)
├── [Logout] button (destructive)
└── [Close] button (ghost)
```

---

## Phase 6: Per-Admin Read Receipts

### File: `src/services/db.ts`

**Changes:**
1. **`markMessagesAsRead`** — Instead of setting `is_read = true`, append current user's UUID to `read_by` array
2. **Unread count queries** — Check if current user's UUID is NOT in `read_by` array
3. **`saveMessage`** — Initialize `read_by` as empty array (or with sender's UUID)

```typescript
// Mark as read for current user
async markMessagesAsRead(projectId: string, userId: string) {
    // Use Postgres array append
    const { error } = await supabase.rpc('mark_messages_read', {
        p_project_id: projectId,
        p_user_id: userId
    });
}
```

### SQL RPC Function:
```sql
CREATE OR REPLACE FUNCTION mark_messages_read(
    p_project_id text,
    p_user_id uuid
) RETURNS void AS $$
BEGIN
    UPDATE public.chat_messages
    SET read_by = array_append(read_by, p_user_id)
    WHERE project_id = p_project_id
    AND NOT (p_user_id = ANY(read_by));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Phase 7: Protected Route — Handle Onboarding

### File: `src/components/auth/ProtectedRoute.tsx`

**Changes:**
- After auth check, if `needsOnboarding` is true, redirect to login page (which will show the name step)
- Or render an inline onboarding modal

---

## File-by-File Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase_schema.sql` | UPDATE | Add `read_by` column, update trigger, add `mark_messages_read` RPC |
| `src/types/user.ts` | UPDATE | Make `email` required |
| `src/contexts/AuthContext.tsx` | UPDATE | Add email login, onboarding flow, fix profile creation |
| `src/contexts/ViewContext.tsx` | UPDATE | Derive admin from user role |
| `src/pages/auth/Login.tsx` | REWRITE | Unified login with phone/email toggle + name onboarding step |
| `src/pages/auth/Signup.tsx` | DELETE | No longer needed |
| `src/App.tsx` | UPDATE | Remove signup route |
| `src/components/layout/Sidebar.tsx` | UPDATE | Fix profile modal (remove photo, add save, show email) |
| `src/components/auth/ProtectedRoute.tsx` | UPDATE | Handle onboarding redirect |
| `src/services/db.ts` | UPDATE | Per-user read receipts using `read_by` array |

---

## Implementation Order

1. **Phase 1** — Run SQL migrations in Supabase (manual)
2. **Phase 2** — Update types + AuthContext  
3. **Phase 3** — Rewrite Login page (unified flow)
4. **Phase 4** — Update ViewContext
5. **Phase 5** — Fix profile modal in Sidebar
6. **Phase 6** — Update db.ts for read receipts
7. **Phase 7** — Update ProtectedRoute

---

## Important Notes

- **Multiple admins**: Each admin logs in with their own `@ateli.co.in` email, gets their own Supabase auth user, and their own profile. Read receipts are tracked per-user via the `read_by` array.
- **No shared state**: Nothing is "shared" between admins — each admin is a fully independent user with role='admin'.
- **Real auth**: Both phone OTP and email OTP are handled by Supabase's built-in auth. No demo/mock auth.
- **SMS costs**: Real phone OTP requires a Twilio (or similar) account. For dev, use Supabase test phone numbers.
