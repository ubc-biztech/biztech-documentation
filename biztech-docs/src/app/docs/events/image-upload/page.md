---
title: Event Image Upload
nextjs:
  metadata:
    title: Event Image Upload
    description: How event thumbnail images are uploaded — the frontend compression, presigned URL generation, S3 upload, and resulting public URL.
---

Event thumbnails are uploaded by admins during event creation or editing. The pipeline compresses the image in the browser, gets a presigned URL from the backend, uploads directly to S3, and returns a public URL. {% .lead %}

---

## Architecture

```
Browser                          Backend                           S3
──────                          ───────                           ──
1. User picks image
2. browser-image-compression
   compresses to ~2.5MB JPEG
3. POST /events/event-image-
   upload-url ──────────────►   createThumbnailPicUploadUrl()
   { fileType, fileName,        │
     prefix: "optimized",       ├── validate fileType (must be image/*)
     eventId }                  ├── sanitize file extension
                                ├── build S3 key:
                                │   event-thumbnails/{eventId}/optimized/{timestamp}.{ext}
                                ├── PutObjectCommand with ContentType, CacheControl
                                └── getSignedUrl(S3, cmd, { expiresIn: 60 })
                                │
   ◄────────────────────────────┘ { uploadUrl, key, publicUrl }

4. PUT uploadUrl with image     ─────────────────────────────────► S3 Bucket
   body (presigned URL)                                            biztech-event-images

5. Uses publicUrl as imageUrl
```

---

## Frontend: EventThumbnailUploader.tsx

**File:** `src/components/Events/EventThumbnailUploader.tsx`

This component handles the full upload flow:

### Image Compression

Before uploading, the image is compressed client-side using `browser-image-compression`:

- **Max size:** ~2.5MB
- **Max dimension:** 2048px (width or height)
- **Output format:** JPEG

### Upload Process

1. Calls `POST /events/event-image-upload-url` with:
   ```json
   {
     "fileType": "image/jpeg",
     "fileName": "event-photo.jpg",
     "prefix": "optimized",
     "eventId": "blueprint"
   }
   ```
2. Backend returns `{ uploadUrl, key, publicUrl }`
3. PUTs the compressed image to `uploadUrl` (the presigned S3 URL)
4. Sets `publicUrl` as the form's `imageUrl` value

### Dual Upload

The component actually uploads two versions:

- **Optimized** (primary): the compressed image — used immediately as `imageUrl`
- **Original** (background): the uncompressed original — uploaded asynchronously as an archive copy

Both uploads go through the same endpoint with different `prefix` values (`"optimized"` vs `"original"`).

### Props

| Prop        | Type                    | Description                                     |
| ----------- | ----------------------- | ----------------------------------------------- |
| `value`     | `string?`               | Current image URL (for edit mode)               |
| `onChange`  | `(url: string) => void` | Callback with the new public URL                |
| `maxSizeMB` | `number?`               | Max file size for validation                    |
| `eventId`   | `string?`               | Used to organize uploads under the event folder |

---

## Backend: createThumbnailPicUploadUrl

**File:** `services/events/handler.js` → `export const createThumbnailPicUploadUrl`
**Endpoint:** `POST /events/event-image-upload-url`
**Auth:** Cognito (admin only)

### Request Validation

```js
helpers.checkPayloadProps(data, {
  fileType: { required: true },
  fileName: { required: true },
  prefix: { required: true },
  eventId: { required: true },
})
```

Additional checks:

- `fileType` must start with `"image/"` — rejects non-image uploads
- File extension is sanitized: `fileName.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "")`

### S3 Key Construction

```
event-thumbnails/{eventId}/{folder}/{timestamp}.{extension}
```

Where:

- `folder` is `"original"` or `"optimized"` — any other prefix value defaults to `"optimized"`
- `timestamp` is `Date.now()` — ensures unique filenames
- `extension` is the sanitized file extension, defaulting to `"jpg"`

Example: `event-thumbnails/blueprint/optimized/1735689600000.jpg`

### Presigned URL Generation

```js
const putCmd = new PutObjectCommand({
  Bucket: 'biztech-event-images',
  Key: key,
  ContentType: fileType,
  CacheControl: 'public, max-age=31536000, immutable',
})

const uploadUrl = await getSignedUrl(S3, putCmd, { expiresIn: 60 })
```

The URL expires after **60 seconds**. The `CacheControl` header ensures aggressive caching on the CDN.

### Response

```json
{
  "uploadUrl": "https://biztech-event-images.s3.us-west-2.amazonaws.com/event-thumbnails/blueprint/optimized/1735689600000.jpg?X-Amz-Algorithm=...",
  "key": "event-thumbnails/blueprint/optimized/1735689600000.jpg",
  "publicUrl": "https://biztech-event-images.s3.us-west-2.amazonaws.com/event-thumbnails/blueprint/optimized/1735689600000.jpg"
}
```

---

## S3 Bucket

| Setting         | Value                                                |
| --------------- | ---------------------------------------------------- |
| Bucket name     | `biztech-event-images`                               |
| Region          | `us-west-2`                                          |
| Key prefix      | `event-thumbnails/`                                  |
| IAM permissions | `s3:PutObject`, `s3:GetObject` (events service role) |

Defined in `services/events/serverless.yml`:

```yaml
iamRoleStatements:
  - Effect: Allow
    Action:
      - s3:PutObject
      - s3:GetObject
    Resource:
      - arn:aws:s3:::biztech-event-images/*
```

---

## CORS Configuration

The image upload endpoint has specific CORS settings in `serverless.yml`:

```yaml
cors:
  origins:
    - http://localhost:3000
    - https://app.ubcbiztech.com
    - https://dev.app.ubcbiztech.com
  headers:
    - Content-Type
    - Authorization
    - X-Amz-Date
    - X-Amz-Security-Token
    - X-Requested-With
  methods:
    - OPTIONS
    - POST
```

---

## Where the Image URL Is Used

Once uploaded, the `publicUrl` is stored on the event record as `imageUrl`. This URL appears in:

| Location                       | How                                    |
| ------------------------------ | -------------------------------------- |
| Public events page (`/events`) | `EventCard.tsx` shows the thumbnail    |
| Registration page              | Header card shows event image          |
| Feedback hub                   | Event image displayed above form links |
| Admin dashboard                | Event header card                      |
| Companion app                  | Event branding                         |

---

## Key Files

| File                                                         | Purpose                                    |
| ------------------------------------------------------------ | ------------------------------------------ |
| `src/components/Events/EventThumbnailUploader.tsx`           | Frontend upload component with compression |
| `services/events/handler.js` → `createThumbnailPicUploadUrl` | Presigned URL generation                   |
| `services/events/serverless.yml`                             | Endpoint definition, IAM, CORS             |

---

## Related Pages

- [Event Creation Flow](/docs/events/creation-flow) — image upload as part of event creation
- [Event Data Model](/docs/events/data-model) — the `imageUrl` field
- [Events Service](/docs/services/events) — all event endpoints
