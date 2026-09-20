LOY TRAVEL v0.2.1 — LOGO/CACHE PATCH

Upload these files/folders into the ROOT of the existing GitHub repo and overwrite files when prompted:

loy-travel-logo.png          NEW
manifest.json                REPLACE
sw.js                        REPLACE
icons/icon-192.png           REPLACE
icons/icon-512.png           REPLACE
icons/apple-touch-icon.png   REPLACE
icons/favicon.png            REPLACE

IMPORTANT:
The main app header must reference /loy-travel-logo.png.
If the current index.html already references /icons/icon-512.png as the visible logo, the replacement icon will also work.
This patch changes the service-worker cache to loy-travel-v021 and removes old caches on activation.
