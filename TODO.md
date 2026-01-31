# Task: Build Web-Based Music Player Application

## Plan
- [x] Step 1: Read key configuration files
- [x] Step 2: Initialize Supabase and create database schema
- [x] Step 3: Create type definitions and API layer
- [x] Step 4: Create AudioContext for global playback state
- [x] Step 5: Build UI components
- [x] Step 6: Update routes and integrate AudioProvider
- [x] Step 7: Fix theme switching issue
- [x] Step 8: Add automatic phone storage scanning
- [x] Step 9: Fix auto-play issue on app load
- [x] Step 10: Add comprehensive debugging for file scanning
- [x] Step 11: Replace directory picker with manual file upload
  - [x] Remove File System Access API (directory picker)
  - [x] Add simple file input for multiple file selection
  - [x] Process selected files and extract metadata
  - [x] Save to localStorage
  - [x] Add clear all function
- [x] Step 12: Run lint and fix issues

## Notes
- Manual file upload implemented
- Users can select multiple audio files at once
- Metadata extracted from filename (Artist - Title format)
- Files stored in memory using object URLs
- Simple and compatible approach
- Support for 9 audio formats: mp3, wav, ogg, m4a, aac, flac, wma, opus, webm
- All UI text in Uzbek language
