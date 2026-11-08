# Private family photos

The photo feature requires one-time Supabase setup before uploads work. Planning still uses its original client and data. Photos use a separate email/password session and a private bucket. Picking a name or knowing `2026` does not grant access.

1. Run only `SUPABASE-v013-PHOTOS.sql` in the existing project's SQL editor. It runs in a transaction and creates new tables, policies and a private bucket. It intentionally fails if these names already exist: check whether an earlier run succeeded instead of rerunning it. Do not run old seed/reset migrations.
2. In Supabase Authentication, create separate email/password accounts for Bryant, Bryson, Bennett and Brooks using actual family-controlled email addresses. Deliver credentials privately and use unique passwords. No app signup form is provided. Disable public signups if no other app on this project needs them. Even an unrelated registered account cannot access photos without membership.
3. Use the commented membership insert example at the bottom of the SQL file with each real auth user UUID and the corresponding name. Confirm that the trip query matches exactly one Maui 2026 trip. Only a trusted dashboard administrator can grant membership; family accounts cannot add or change members.
4. Upload the changed website files, retaining their paths. No additional environment variables or service-role keys are needed. Keep `/api/config` on the existing publishable key.
5. Open Photos on each phone and sign in once with that person's photo account. Upload attribution comes from the approved account, independently of the planning profile picker. Take a photo or select one from the library, optionally add caption/day/activity, and upload. Keep the original on the phone: shared copies are resized to 2560px and re-encoded as JPEG, stripping original EXIF/GPS metadata.

Guest and Grandpa Rick see a private-family explanation without photos or upload controls. Sign out of photos before sharing a family device. Selecting Guest hides and clears the in-memory gallery but does not sign the family account out; profile selection is not a security boundary on a shared device. Signed image links are bearer links valid for five minutes; do not share them outside the family. Refresh the gallery when images expire. Images are not saved into the service worker cache.

Before using real photos, verify against your Supabase project:

- Approved family account: upload a sample, refresh, and confirm it appears on another approved phone; filter person/day.
- Guest, anonymous API client and a signed-in nonmember: metadata, storage listing, file downloads and uploads must be denied.
- Member cannot forge another person's metadata or upload to another user's folder. Member can read the family gallery across all four people.
- The bucket remains private; a public object URL fails. Updating or overwriting files is denied. Failed metadata inserts remove the unlisted upload when possible; administrators can inspect and clean orphans in Storage.
- Removing a membership revokes future API access. Previously issued image links can work until their five-minute expiry. For immediate revocation, remove the object through the dashboard.

This pass does not change the older planning tables' access policies. Guest controls there remain the app's existing read-only UI, not a new backend security guarantee. The private-photo tables and bucket have their own enforced access rules. Full live RLS verification requires the project's dashboard/accounts and has not been executed by this package.

Back up your Supabase data before applying migrations as usual. No existing rows are reset or reseeded. Photo deletion/editing and original-resolution archival are not part of this pass; administrators manage removal in the dashboard.
