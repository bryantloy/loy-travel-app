# Maui trip photos — no accounts

For Bryant, Bryson, Bennett, Brooks and Grandpa Rick: pick your normal app profile, open Photos, and take or upload a photo. No email, password or separate photo sign-in. Guests can browse but get no upload controls.

Bryant needs to apply one update to the already configured Supabase project:

1. Run `SUPABASE-v014-LINK-PHOTOS.sql` once in the SQL editor, after the previously applied v013 migration. It changes photo permissions and adds the shared-link metadata table. It retains all existing photos, copies their metadata into the new gallery, and leaves planning data unchanged. No need to create, edit or delete user accounts or memberships.
2. Replace `app.js`, `memories.js` and `styles.css` together with this package's versions. Keep the v013 `index.html`, which already loads memories.js. Refresh the app on the phones.
3. Upload a test photo, then check it from another phone. Try Grandpa Rick's profile too. Confirm the person/day filters and existing photos. Guest should have a gallery but no upload form.

If the SQL reports a missing v013 table/policy, the earlier migration has not been fully applied. Do not run old seeds or reset the database. The update is transactional, so a failed run rolls back this update.

This deliberately uses shared-link access for this trip. Profile names are labels, not verified identities; Guest is read-only in the UI, not a separate database role. Anyone who obtains the app's public connection details can read/upload through the API. The storage bucket remains technically private and images use five-minute signed links, but the app can issue those links without sign-in, so this is not private family authentication. Overwriting, deleting listed photos, and editing/deleting metadata through the app are still blocked by the new rules. Administrators can remove photos in the Supabase dashboard.

Shared copies are resized to a maximum of 2560 pixels and re-encoded as JPEG; originals and original EXIF/GPS metadata are not retained. Keep originals on the phones. Captions, day and activity remain optional. If HEIC cannot open, select a JPEG copy. Tap Refresh if image links expire.

This supersedes the v013 account setup instructions. Existing photo accounts may remain unused. No production SQL or deployment is run automatically by this ZIP. Live database/storage checks still need to be done after applying it.
