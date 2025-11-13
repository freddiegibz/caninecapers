"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../../src/lib/supabaseClient";
import styles from "./page.module.css";

type GalleryImage = {
  id: string;
  url: string;
  field: string;
  field_id: number;
  created_at: string;
  user_id?: string;
  caption?: string;
};

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedField, setSelectedField] = useState<number>(0); // 0 = all, 4783035 = Central Bark, 6255352 = Hyde Bark
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadField, setUploadField] = useState<number>(4783035);
  const [uploadCaption, setUploadCaption] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Load gallery images
  useEffect(() => {
    let isMounted = true;
    const loadImages = async () => {
      try {
        setLoading(true);
        // For now, we'll create a mock structure - you'll need to create a gallery table in Supabase
        // This is just the frontend structure
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading gallery:', error);
          // For now, use empty array if table doesn't exist
          if (isMounted) setImages([]);
          return;
        }

        if (isMounted && data) {
          setImages(data);
        }
      } catch (error) {
        console.error('Error loading gallery:', error);
        if (isMounted) setImages([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadImages();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter images by field
  const filteredImages = selectedField === 0
    ? images
    : images.filter(img => img.field_id === selectedField);

  // Handle image upload
  const handleUpload = async () => {
    if (!uploadFile) return;

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please log in to upload photos');
        return;
      }

      // Generate unique filename
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload image. Please try again.');
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      // Get field name
      const fieldName = uploadField === 4783035 ? 'Central Bark' : 'Hyde Bark';

      // Insert into gallery table
      const { error: insertError } = await supabase
        .from('gallery')
        .insert({
          url: urlData.publicUrl,
          field: fieldName,
          field_id: uploadField,
          user_id: user.id,
          caption: uploadCaption || null
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        alert('Failed to save image. Please try again.');
        return;
      }

      // Refresh images
      const { data: newData } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (newData) {
        setImages(newData);
      }

      // Reset form
      setUploadFile(null);
      setUploadCaption("");
      setUploadField(4783035);
      setShowUploadModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB');
        return;
      }
      setUploadFile(file);
    }
  };

  // Open lightbox
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  // Close lightbox
  const closeLightbox = () => {
    setShowLightbox(false);
  };

  // Navigate lightbox
  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setLightboxIndex(prev => (prev > 0 ? prev - 1 : filteredImages.length - 1));
    } else {
      setLightboxIndex(prev => (prev < filteredImages.length - 1 ? prev + 1 : 0));
    }
  };

  // Close lightbox on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLightbox) {
        closeLightbox();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showLightbox]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (showLightbox) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLightbox]);

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navbarContent}>
          <div className={styles.greeting}>
            <Link href="/dashboard" className={styles.logoLink}>
              <Image
                src="/caninecaperslogosymbol.png"
                alt="Canine Capers"
                width={32}
                height={32}
                className={styles.logoIcon}
              />
            </Link>
            <h1 className={styles.brandTitle}>Canine Capers</h1>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <main className={styles.main}>
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Field Gallery</h1>
            <p className={styles.pageSubtitle}>Share photos of your dogs enjoying the fields</p>
            <div className={styles.headerDivider}></div>
          </header>

          <section className={styles.section}>
            {/* Filter and Upload Bar */}
            <div className={styles.controlsBar}>
              <div className={styles.filterContainer}>
                <label className={styles.filterLabel}>Field:</label>
                <select
                  className={styles.filterSelect}
                  value={selectedField}
                  onChange={(e) => setSelectedField(Number(e.target.value))}
                >
                  <option value={0}>All Fields</option>
                  <option value={4783035}>Central Bark</option>
                  <option value={6255352}>Hyde Bark</option>
                </select>
              </div>
              <button
                className={styles.uploadButton}
                onClick={() => setShowUploadModal(true)}
              >
                <span>+</span>
                Upload Photo
              </button>
            </div>

            {/* Gallery Grid */}
            {loading ? (
              <div className={styles.loadingState}>
                <p>Loading gallery...</p>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No photos yet. Be the first to upload!</p>
              </div>
            ) : (
              <div className={styles.galleryGrid}>
                {filteredImages.map((image, index) => (
                  <div
                    key={image.id}
                    className={styles.galleryItem}
                    onClick={() => openLightbox(index)}
                  >
                    <Image
                      src={image.url}
                      alt={image.caption || `Photo from ${image.field}`}
                      width={300}
                      height={300}
                      className={styles.galleryImage}
                      loading="lazy"
                    />
                    <div className={styles.imageOverlay}>
                      <span className={styles.fieldBadge}>{image.field}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className={styles.modalOverlay} onClick={() => setShowUploadModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Upload Photo</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.uploadSection}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className={styles.fileInput}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className={styles.fileLabel}>
                  {uploadFile ? (
                    <div className={styles.filePreview}>
                      <Image
                        src={URL.createObjectURL(uploadFile)}
                        alt="Preview"
                        width={200}
                        height={200}
                        className={styles.previewImage}
                      />
                      <span className={styles.fileName}>{uploadFile.name}</span>
                    </div>
                  ) : (
                    <div className={styles.filePlaceholder}>
                      <span className={styles.uploadIcon}>📷</span>
                      <span>Choose an image</span>
                    </div>
                  )}
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Field</label>
                <select
                  className={styles.formSelect}
                  value={uploadField}
                  onChange={(e) => setUploadField(Number(e.target.value))}
                >
                  <option value={4783035}>Central Bark</option>
                  <option value={6255352}>Hyde Bark</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Caption (optional)</label>
                <textarea
                  className={styles.formTextarea}
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Add a caption..."
                  rows={3}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className={styles.submitButton}
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {showLightbox && filteredImages.length > 0 && (
        <div
          className={styles.lightboxOverlay}
          onClick={closeLightbox}
          ref={lightboxRef}
        >
          <button
            className={styles.lightboxClose}
            onClick={closeLightbox}
            aria-label="Close"
          >
            ×
          </button>
          <button
            className={styles.lightboxPrev}
            onClick={(e) => {
              e.stopPropagation();
              navigateLightbox('prev');
            }}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            className={styles.lightboxNext}
            onClick={(e) => {
              e.stopPropagation();
              navigateLightbox('next');
            }}
            aria-label="Next"
          >
            ›
          </button>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <Image
              src={filteredImages[lightboxIndex].url}
              alt={filteredImages[lightboxIndex].caption || `Photo from ${filteredImages[lightboxIndex].field}`}
              width={1200}
              height={1200}
              className={styles.lightboxImage}
              priority
            />
            <div className={styles.lightboxInfo}>
              <span className={styles.lightboxField}>{filteredImages[lightboxIndex].field}</span>
              {filteredImages[lightboxIndex].caption && (
                <p className={styles.lightboxCaption}>{filteredImages[lightboxIndex].caption}</p>
              )}
              <span className={styles.lightboxCounter}>
                {lightboxIndex + 1} / {filteredImages.length}
              </span>
            </div>
          </div>
        </div>
      )}

      <footer className={styles.mobileFooter} aria-label="Primary actions">
        <Link href="/dashboard" className={styles.footerAction}>
          <Image
            src="/images/homeicon.png"
            alt="Dashboard"
            width={32}
            height={32}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Home</span>
        </Link>

        <Link href="/book" className={styles.footerAction}>
          <Image
            src="/booksession.png"
            alt="Book Session"
            width={32}
            height={32}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Book</span>
        </Link>

        <Link href="/gallery" className={styles.footerAction} aria-current="page">
          <Image
            src="/images/galleryicon.png"
            alt="Gallery"
            width={32}
            height={32}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Gallery</span>
        </Link>

        <Link href="/my-sessions" className={styles.footerAction}>
          <Image
            src="/viewsessions.png"
            alt="My Sessions"
            width={32}
            height={32}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Sessions</span>
        </Link>

        <Link href="/location" className={styles.footerAction}>
          <Image
            src="/location.png"
            alt="Locations"
            width={32}
            height={32}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Location</span>
        </Link>

        <Link href="/settings" className={styles.footerAction}>
          <Image
            src="/images/settingsicon.png"
            alt="Settings"
            width={32}
            height={32}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Settings</span>
        </Link>
      </footer>
    </>
  );
}

