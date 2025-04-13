const API_BASE = "https://songsbackend-livid.vercel.app/api";
const ADMIN_PASSWORD = "admin4312"

// Global Audio Player Element
const audioPlayer = document.getElementById("audio-player")

// Common function to show messages
function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId)
    if (element) {
        element.textContent = message
        element.style.color = isError ? "#e74c3c" : "#2ecc71"
        setTimeout(() => (element.textContent = ""), 3000)
    }
}

// Video background control - prevent looping
if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
    const bgVideo = document.getElementById("bg-video")
    if (bgVideo) {
        bgVideo.addEventListener("ended", function () {
            // When video ends, freeze on the last frame
            this.currentTime = this.duration - 0.1
            this.pause()
        })
    }
}

// ------------------
// Main Player Logic
// ------------------
if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
    async function initializePlayer() {
        try {
            // Show loading animation in song list
            const songList = document.getElementById("song-list")
            songList.innerHTML = `
      <div class="song-loading">
        <div class="loading-spinner"></div>
      </div>
    `

            const response = await fetch(`${API_BASE}/songs`)
            if (!response.ok) throw new Error("Failed to load songs")

            const songs = await response.json()
            populateSongList(songs)
            setupEventListeners()

            if (songs.length > 0) {
                const firstSong = songs[0]
                updateCurrentSongUI(firstSong)
                audioPlayer.src = firstSong.fileUrl
            } else {
                // Replace loading animation with "No songs" message
                document.getElementById("current-song-name").innerHTML = "No songs available"
            }
        } catch (error) {
            console.error("Initialization error:", error)

            // Show error with icon instead of text
            document.getElementById("current-song-name").innerHTML = `
      <span style="color: #e74c3c;">
        <span style="display: inline-block; margin-right: 5px;">⚠️</span> Error
      </span>
    `

            // Show error in song list
            const songList = document.getElementById("song-list")
            songList.innerHTML = `
      <div class="song-loading" style="color: #e74c3c;">
        <span style="display: inline-block; margin-right: 5px;">⚠️</span>
        Error loading songs. Please try again.
      </div>
    `
        }
    }

    async function playSong(songId) {
        try {
            // Find the song item and add loading class
            const songElement = document.querySelector(`.song-item[data-id="${songId}"]`)
            if (songElement) {
                songElement.classList.add("loading")
            }

            // Add loading animation to dropdown
            const songDropdown = document.getElementById("song-dropdown")
            songDropdown.classList.add("loading")

            // Add loading animation to now playing
            updateNowPlayingWithAnimation(true)

            const response = await fetch(`${API_BASE}/songs/play/${songId}`, {
                method: "PUT",
            })

            if (!response.ok) throw new Error("Failed to update play count")
            const updatedSong = await response.json()

            // Remove loading states
            if (songElement) {
                songElement.classList.remove("loading")
            }
            songDropdown.classList.remove("loading")

            updateCurrentSongUI(updatedSong)

            // Update play count in the list
            if (songElement) {
                songElement.querySelector(".play-badge").textContent = updatedSong.playCount
            }

            // Update the play count in the dropdown header
            document.getElementById("current-play-count").textContent = updatedSong.playCount

            audioPlayer.src = updatedSong.fileUrl
            audioPlayer.play()
        } catch (error) {
            console.error("Play error:", error)

            // Remove loading states on error
            document.querySelectorAll(".song-item.loading").forEach((item) => {
                item.classList.remove("loading")
            })
            document.getElementById("song-dropdown").classList.remove("loading")
            updateNowPlayingWithAnimation(false)

            // Show error message
            document.getElementById("current-song-name").textContent = "Error playing song"
        }
    }

    function updateNowPlayingWithAnimation(isLoading = false) {
        const nowPlaying = document.getElementById("now-playing")
        const currentSongName = document.getElementById("current-song-name").textContent

        if (isLoading) {
            nowPlaying.innerHTML = `
        Now playing: <span id="current-song-name">Loading</span>
        <div class="now-playing-animation">
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>
      `
        } else {
            nowPlaying.innerHTML = `Now playing: <span id="current-song-name">${currentSongName}</span>`
        }
    }

    function updateCurrentSongUI(song) {
        // Update now playing with animation
        const nowPlaying = document.getElementById("now-playing")
        nowPlaying.innerHTML = `
      Now playing: <span id="current-song-name">${song.title}</span>
      <div class="now-playing-animation">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </div>
    `

        // Update the selected song text and play count in the dropdown
        document.getElementById("selected-song-text").textContent = song.title
        document.getElementById("current-play-count").textContent = song.playCount
    }

    function populateSongList(songs) {
        const songList = document.getElementById("song-list")

        if (songs.length === 0) {
            songList.innerHTML = `<div class="song-loading">No songs available</div>`
            return
        }

        songList.innerHTML = songs
            .map(
                (song) => `
      <div class="song-item" data-id="${song._id}">
        <span class="song-name">${song.title}</span>
        <div class="play-badge">${song.playCount}</div>
      </div>
    `,
            )
            .join("")
    }

    function setupEventListeners() {
        const dropdown = document.getElementById("song-dropdown")
        const songList = document.getElementById("song-list")
        const selectedText = document.getElementById("selected-song-text")
        const currentPlayCount = document.getElementById("current-play-count")

        // Toggle song list dropdown
        dropdown.addEventListener("click", () => {
            songList.classList.toggle("open")
        })

        // Handle song selection clicks
        songList.addEventListener("click", (e) => {
            const item = e.target.closest(".song-item")
            if (!item || item.classList.contains("loading")) return

            const songId = item.dataset.id
            const songName = item.querySelector(".song-name").textContent
            const playCount = item.querySelector(".play-badge").textContent

            // Update UI for selected song
            selectedText.textContent = songName
            currentPlayCount.textContent = playCount

            // Update active class for the selected item
            document.querySelectorAll(".song-item").forEach((el) => el.classList.remove("active"))
            item.classList.add("active")

            playSong(songId)
            songList.classList.remove("open")
        })
    }

    // Initialize player when DOM is loaded
    document.addEventListener("DOMContentLoaded", () => {
        if (document.querySelector(".content")) initializePlayer()
    })
}

// ---------------------
// Upload Page Logic
// ---------------------
if (window.location.pathname.endsWith("upload.html")) {
    document.addEventListener("DOMContentLoaded", () => {
        const passwordScreen = document.getElementById("password-screen")
        const uploadFormContainer = document.getElementById("upload-form-container")
        const accessButton = document.getElementById("accessButton")
        const accessPassword = document.getElementById("accessPassword")
        const songFile = document.getElementById("songFile")
        const fileName = document.getElementById("file-name")

        // Handle file selection display
        if (songFile) {
            songFile.addEventListener("change", function () {
                if (this.files.length > 0) {
                    fileName.textContent = this.files[0].name
                } else {
                    fileName.textContent = "No file chosen"
                }
            })
        }

        // Tab switching functionality
        const tabButtons = document.querySelectorAll(".tab-btn")
        const tabContents = document.querySelectorAll(".tab-content")

        tabButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const tabName = button.dataset.tab

                // Update active tab button
                tabButtons.forEach((btn) => btn.classList.remove("active"))
                button.classList.add("active")

                // Show active tab content
                tabContents.forEach((content) => content.classList.remove("active"))
                document.getElementById(`${tabName}-tab`).classList.add("active")

                // Load songs when switching to manage tab
                if (tabName === "manage") {
                    loadSongsForAdmin()
                }
            })
        })

        // Load songs for admin management
        async function loadSongsForAdmin() {
            const songListContainer = document.getElementById("admin-song-list")

            try {
                songListContainer.innerHTML = `
      <div class="song-loading">
        <div class="loading-spinner"></div>
      </div>
    `

                const response = await fetch(`${API_BASE}/songs`)
                if (!response.ok) throw new Error("Failed to load songs")

                const songs = await response.json()

                if (songs.length === 0) {
                    songListContainer.innerHTML = `
        <div class="loading-songs">
          <span style="opacity: 0.7;">No songs available</span>
        </div>
      `
                    return
                }

                songListContainer.innerHTML = songs
                    .map(
                        (song) => `
        <div class="admin-song-item" data-id="${song._id}">
          <div class="song-title">${song.title}</div>
          <div class="song-artist">${song.artist || "Unknown"}</div>
          <div class="song-plays">${song.playCount}</div>
          <div class="song-actions">
            <button class="action-btn edit-btn" data-id="${song._id}">Edit</button>
            <button class="action-btn delete-btn" data-id="${song._id}">Delete</button>
          </div>
        </div>
      `,
                    )
                    .join("")

                // Add event listeners to edit and delete buttons
                setupSongActionListeners()
            } catch (error) {
                console.error("Error loading songs:", error)
                songListContainer.innerHTML = `
          <div class="song-loading" style="color: #e74c3c;">
            Error loading songs. Please try again.
          </div>
        `
            }
        }

        // Setup listeners for edit and delete buttons
        function setupSongActionListeners() {
            // Edit button listeners
            document.querySelectorAll(".edit-btn").forEach((button) => {
                button.addEventListener("click", (e) => {
                    const songId = e.target.dataset.id
                    openEditModal(songId)
                })
            })

            // Delete button listeners
            document.querySelectorAll(".delete-btn").forEach((button) => {
                button.addEventListener("click", async (e) => {
                    if (confirm("Are you sure you want to delete this song?")) {
                        const songId = e.target.dataset.id
                        await deleteSong(songId)
                    }
                })
            })
        }

        // Delete song function
        async function deleteSong(songId) {
            try {
                // Find the song item in the DOM and add a deleting class for visual feedback
                const songElement = document.querySelector(`.admin-song-item[data-id="${songId}"]`)
                if (songElement) {
                    songElement.classList.add("deleting")
                    songElement.innerHTML = '<div class="deleting-message">Deleting...</div>'
                }

                const response = await fetch(`${API_BASE}/songs/${songId}`, {
                    method: "DELETE",
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || "Failed to delete song")
                }

                // If the song element exists, remove it with animation
                if (songElement) {
                    songElement.style.height = "0"
                    songElement.style.opacity = "0"
                    songElement.style.padding = "0"
                    songElement.style.margin = "0"

                    // Remove the element after animation completes
                    setTimeout(() => {
                        songElement.remove()

                        // Check if there are no songs left
                        const remainingSongs = document.querySelectorAll(".admin-song-item")
                        if (remainingSongs.length === 0) {
                            document.getElementById("admin-song-list").innerHTML =
                                '<div class="loading-songs">No songs available</div>'
                        }
                    }, 300)
                } else {
                    // Fallback to reloading the entire list if we can't find the element
                    loadSongsForAdmin()
                }

                showMessage("uploadStatus", "Song deleted successfully")
            } catch (error) {
                console.error("Delete error:", error)
                showMessage("uploadStatus", error.message || "Failed to delete song", true)

                // Reload the list in case of error to ensure UI consistency
                loadSongsForAdmin()
            }
        }

        // Edit modal functionality
        const editModal = document.getElementById("edit-modal")
        const closeModal = document.querySelector(".close-modal")
        const editForm = document.getElementById("editForm")

        // Close modal when clicking X
        if (closeModal) {
            closeModal.addEventListener("click", () => {
                editModal.style.display = "none"
            })
        }

        // Close modal when clicking outside
        window.addEventListener("click", (e) => {
            if (e.target === editModal) {
                editModal.style.display = "none"
            }
        })

        // Open edit modal and populate with song data
        async function openEditModal(songId) {
            try {
                // Show loading in the modal
                editModal.style.display = "block"
                document.getElementById("editForm").innerHTML = `
          <div class="song-loading">
            <div class="loading-spinner"></div>
          </div>
        `

                const response = await fetch(`${API_BASE}/songs/${songId}`)
                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || "Failed to fetch song details")
                }

                const song = await response.json()

                // Restore the form with data
                document.getElementById("editForm").innerHTML = `
          <input type="hidden" id="editSongId" value="${song._id}">
          <div class="form-group">
              <label for="editTitle">Song Title</label>
              <input type="text" id="editTitle" value="${song.title}" required>
          </div>
          <div class="form-group">
              <label for="editArtist">Artist Name</label>
              <input type="text" id="editArtist" value="${song.artist || ""}">
          </div>
          <button type="submit" class="btn-primary btn-animated">
              <span class="btn-text">Save Changes</span>
              <span class="btn-loader"></span>
          </button>
        `

                // Re-attach the submit event listener
                attachEditFormListener()
            } catch (error) {
                console.error("Error fetching song details:", error)
                document.getElementById("editForm").innerHTML = `
          <div class="song-loading" style="color: #e74c3c;">
            Error loading song details. Please try again.
          </div>
          <button type="button" class="btn-primary" onclick="document.getElementById('edit-modal').style.display='none'">
            Close
          </button>
        `
            }
        }

        // Attach event listener to edit form
        function attachEditFormListener() {
            const editForm = document.getElementById("editForm")
            if (editForm) {
                editForm.addEventListener("submit", async (e) => {
                    e.preventDefault()

                    const submitButton = editForm.querySelector("button[type='submit']")
                    submitButton.classList.add("loading")
                    submitButton.disabled = true

                    const songId = document.getElementById("editSongId").value
                    const title = document.getElementById("editTitle").value
                    const artist = document.getElementById("editArtist").value

                    try {
                        const response = await fetch(`${API_BASE}/songs/${songId}`, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ title, artist }),
                        })

                        if (!response.ok) {
                            const errorData = await response.json()
                            throw new Error(errorData.error || "Failed to update song")
                        }

                        // Close modal and reload songs
                        editModal.style.display = "none"
                        loadSongsForAdmin()
                        showMessage("uploadStatus", "Song updated successfully")
                    } catch (error) {
                        console.error("Update error:", error)
                        showMessage("uploadStatus", error.message || "Failed to update song", true)
                    } finally {
                        submitButton.classList.remove("loading")
                        submitButton.disabled = false
                    }
                })
            }
        }

        // Handle admin access
        if (accessButton) {
            accessButton.addEventListener("click", () => {
                if (accessPassword.value === ADMIN_PASSWORD) {
                    passwordScreen.classList.add("hidden")
                    uploadFormContainer.classList.remove("hidden")
                } else {
                    showMessage("accessStatus", "Invalid password", true)
                }
            })

            // Also allow Enter key to submit
            accessPassword.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault()
                    accessButton.click()
                }
            })
        }

        // Handle form submission
        const uploadForm = document.getElementById("uploadForm")
        if (uploadForm) {
            uploadForm.addEventListener("submit", async (e) => {
                e.preventDefault()

                const title = document.getElementById("songTitle").value
                const artist = document.getElementById("artistName").value
                const file = document.getElementById("songFile").files[0]
                const uploadButton = document.getElementById("uploadButton")

                if (!title || !file) {
                    showMessage("uploadStatus", "Please fill all required fields", true)
                    return
                }

                // Disable button and show loading animation
                uploadButton.classList.add("loading")
                uploadButton.disabled = true

                // Prepare form data for file upload
                const formData = new FormData()
                formData.append("title", title)
                if (artist) formData.append("artist", artist)
                formData.append("song", file)

                try {
                    showMessage("uploadStatus", "Uploading...", false)

                    const response = await fetch(`${API_BASE}/songs`, {
                        method: "POST",
                        body: formData,
                    })

                    if (!response.ok) {
                        const errorData = await response.json()
                        throw new Error(errorData.error || "Upload failed")
                    }

                    const result = await response.json()
                    showMessage("uploadStatus", "Upload successful!")
                    uploadForm.reset()
                    fileName.textContent = "No file chosen"

                    // If we're in the manage tab, refresh the song list
                    if (document.getElementById("manage-tab").classList.contains("active")) {
                        loadSongsForAdmin()
                    }
                } catch (error) {
                    showMessage("uploadStatus", error.message || "Upload failed", true)
                } finally {
                    // Re-enable button and hide loading animation
                    uploadButton.classList.remove("loading")
                    uploadButton.disabled = false
                }
            })
        }
    })
}
