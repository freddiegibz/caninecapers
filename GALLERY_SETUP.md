# Supabase Gallery Setup Guide

## Step 1: Create the Gallery Table

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL from `supabase-gallery-setup.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)

This creates:
- `gallery` table with columns: id, url, field, field_id, user_id, caption, created_at
- Indexes for faster queries
- Row Level Security (RLS) policies:
  - Everyone can view images
  - Authenticated users can upload their own images
  - Users can delete their own images

## Step 2: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **New bucket**
3. Configure:
   - **Name**: `gallery`
   - **Public bucket**: ✅ **YES** (check this!)
   - **File size limit**: `5242880` (5 MB in bytes)
   - **Allowed MIME types**: `image/*`
4. Click **Create bucket**

## Step 3: Set Storage Policies

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL from `supabase-storage-setup.sql`
4. Click **Run**

This creates storage policies:
- Anyone can view gallery images
- Authenticated users can upload images
- Users can delete their own images

## Step 4: Verify Setup

### Test Table:
```sql
-- Check if table exists
SELECT * FROM gallery LIMIT 1;
```

### Test Storage:
1. Go to **Storage** → **gallery** bucket
2. Try uploading a test image manually
3. Check if it's accessible via public URL

## Step 5: Update Frontend (if needed)

The frontend code in `app/gallery/page.tsx` should work once the above is set up. Make sure:

1. Your Supabase client is configured correctly in `src/lib/supabaseClient.ts`
2. Users are authenticated (the gallery requires login to upload)

## Troubleshooting

### "Bucket not found" error:
- Make sure the bucket name is exactly `gallery` (lowercase)
- Check that the bucket exists in Storage → Buckets

### "Permission denied" error:
- Check that RLS policies are enabled on the `gallery` table
- Verify storage policies are created correctly
- Make sure the user is authenticated

### Images not displaying:
- Check that the bucket is set to **Public**
- Verify the URL format matches: `https://[project].supabase.co/storage/v1/object/public/gallery/[path]`
- Check browser console for CORS errors

### Upload fails:
- Check file size (must be under 5MB)
- Verify file type is an image (image/*)
- Check that user is authenticated
- Look at Supabase logs for detailed error messages

## Storage Usage Monitoring

Monitor your storage usage:
- **Dashboard** → **Storage** → **gallery** bucket
- Check total size and file count
- Free tier: 1 GB storage, 2 GB bandwidth/month

## Next Steps

Once set up:
1. Test uploading an image from the gallery page
2. Verify images appear in the gallery grid
3. Test filtering by field
4. Test the lightbox view
5. Consider adding image optimization/compression to save storage



