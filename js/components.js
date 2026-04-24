/**
 * Renaissance UI Components
 */

// --- 1. Image Comparison Slider ---
class ImageSlider {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.handle = this.container.querySelector('.slider-handle');
        this.clipLayer = this.container.querySelector('.slider-clip-layer');
        this.isDragging = false;

        if (!this.handle || !this.clipLayer) return;

        this.init();
    }

    init() {
        this.handle.addEventListener('pointerdown', (e) => this.startDrag(e));
        window.addEventListener('pointermove', (e) => this.onDrag(e));
        window.addEventListener('pointerup', () => this.stopDrag());
    }

    startDrag(e) {
        this.isDragging = true;
        this.updatePosition(e.clientX);
    }

    onDrag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.updatePosition(e.clientX);
    }

    stopDrag() {
        this.isDragging = false;
    }

    updatePosition(clientX) {
        const rect = this.container.getBoundingClientRect();
        let x = clientX - rect.left;

        // Clamp
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;

        const percentage = (x / rect.width) * 100;

        this.handle.style.left = `${percentage}%`;

        // Top Layer = "Original" (Left). Clip Path: inset(0 (100-P)% 0 0) -> Visible from 0 to P.
        this.clipLayer.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    }
}

// --- 2. Filter Pills ---
class FilterPills {
    constructor(containerId, options = { multi: false }) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.options = options;
        this.buttons = this.container.querySelectorAll('button');

        this.init();
    }

    init() {
        this.buttons.forEach(btn => {
            btn.addEventListener('click', () => this.toggle(btn));
        });
    }

    toggle(clickedBtn) {
        // Visual classes
        const activeClasses = ['bg-purple-600', 'text-white'];
        const inactiveClasses = ['bg-transparent', 'text-purple-600', 'hover:bg-white'];

        if (!this.options.multi) {
            // Reset all others
            this.buttons.forEach(btn => {
                if (btn !== clickedBtn) {
                    btn.classList.remove(...activeClasses);
                    // Only add inactive classes if it's not the "All" button style mismatch
                    // But assume uniform styles for now
                    btn.classList.add(...inactiveClasses);
                }
            });
            // Activate clicked
            clickedBtn.classList.remove(...inactiveClasses);
            clickedBtn.classList.add(...activeClasses);
        } else {
            // Toggle
            if (clickedBtn.classList.contains('bg-purple-600')) {
                clickedBtn.classList.remove(...activeClasses);
                clickedBtn.classList.add(...inactiveClasses);
            } else {
                clickedBtn.classList.remove(...inactiveClasses);
                clickedBtn.classList.add(...activeClasses);
            }
        }
    }
}

// --- 3. Video Controls ---
class VideoControls {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.playBtn = this.container.querySelector('.play-btn');
        this.icon = this.playBtn?.querySelector('.material-symbols-outlined');
        this.isPlaying = false;

        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => this.togglePlay());
        }
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        if (this.icon) {
            this.icon.textContent = this.isPlaying ? 'pause' : 'play_arrow';
        }
    }
}

// --- 3b. Lecture Model ---
class LectureModal {
    constructor() {
        this.createModal();
    }

    createModal() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'fixed inset-0 z-[100] bg-purple-900/90 backdrop-blur-sm flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300';
        this.overlay.innerHTML = `
            <div class="bg-black w-full max-w-5xl aspect-video rounded-2xl shadow-2xl relative overflow-hidden transform scale-95 transition-transform duration-300 aspect-video flex flex-col">
                <button class="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors close-btn">
                    <span class="material-symbols-outlined">close</span>
                </button>
                <div id="youtube-embed-container" class="w-full h-full">
                    <!-- Iframe injected here -->
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.overlay.querySelector('.close-btn').addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }

    open(lesson) {
        const container = this.overlay.querySelector('#youtube-embed-container');
        // Using youtube-nocookie and adding origin might help, but a fallback is safest for Error 153
        container.innerHTML = `
            <div class="flex flex-col h-full">
                <div class="flex-1 relative bg-black">
                     <iframe width="100%" height="100%" 
                        src="https://www.youtube-nocookie.com/embed/${lesson.videoId}?autoplay=1&rel=0&modestbranding=1" 
                        title="${lesson.title}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div class="bg-purple-900 text-white p-4 flex items-center justify-between shrink-0">
                    <div>
                        <h3 class="font-serif-display text-lg font-bold">${lesson.title}</h3>
                        <p class="text-xs text-purple-300">If the video doesn't play (Error 150/153), the owner has disabled playback on other sites.</p>
                    </div>
                    <a href="https://www.youtube.com/watch?v=${lesson.videoId}" target="_blank" 
                        class="px-4 py-2 bg-white text-purple-900 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-100 transition-colors">
                        <span>Watch on YouTube</span>
                        <span class="material-symbols-outlined text-[16px]">open_in_new</span>
                    </a>
                </div>
            </div>
        `;

        this.overlay.classList.remove('opacity-0', 'pointer-events-none');
        this.overlay.querySelector('div.aspect-video').classList.remove('scale-95');
        this.overlay.querySelector('div.aspect-video').classList.add('scale-100');
    }

    close() {
        this.overlay.classList.add('opacity-0', 'pointer-events-none');
        this.overlay.querySelector('div').classList.remove('scale-100');
        this.overlay.querySelector('div').classList.add('scale-95');

        // Clear iframe to stop audio
        setTimeout(() => {
            this.overlay.querySelector('#youtube-embed-container').innerHTML = '';
        }, 300);
    }
}

// --- 4. Drag & Drop Zone ---
class DragDropZone {
    constructor(zoneId, inputId) {
        this.zone = document.getElementById(zoneId);
        this.input = document.getElementById(inputId);
        if (!this.zone) return;

        this.init();
    }

    init() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.zone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        this.zone.addEventListener('dragenter', () => this.highlight());
        this.zone.addEventListener('dragover', () => this.highlight());
        this.zone.addEventListener('dragleave', () => this.unhighlight());
        this.zone.addEventListener('drop', (e) => this.handleDrop(e));

        // Click to upload
        this.zone.addEventListener('click', () => {
            if (this.input) this.input.click();
        });

        if (this.input) {
            this.input.addEventListener('change', (e) => this.handleFiles(e.target.files));
        }
    }

    highlight() {
        this.zone.classList.add('border-purple-500', 'bg-purple-100/50', 'scale-[1.02]');
        this.zone.classList.remove('border-white', 'bg-parchment-200');
    }

    unhighlight() {
        this.zone.classList.remove('border-purple-500', 'bg-purple-100/50', 'scale-[1.02]');
        this.zone.classList.add('border-white', 'bg-parchment-200');
    }

    handleDrop(e) {
        this.unhighlight();
        const files = e.dataTransfer.files;
        this.handleFiles(files);
    }

    handleFiles(files) {
        if (files.length > 0) {
            // Simulate processing
            if (window.renaissanceSettings) {
                window.renaissanceSettings.showNotification(`Received ${files[0].name}. Processing...`, 'info');
            }
            setTimeout(() => {
                window.location.href = 'processing.html';
            }, 1000);
        }
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Export Page Slider
    if (document.getElementById('compare-slider')) {
        new ImageSlider('compare-slider');
    }

    // 2. Intro Page Filters
    if (document.getElementById('course-filters')) {
        new FilterPills('course-filters');
    }
    if (document.getElementById('gallery-filters')) {
        new FilterPills('gallery-filters');
    }

    // 3. Review Page Video
    if (document.getElementById('video-player')) {
        new VideoControls('video-player');
    }

    // 4. Lecture System (Intro Page)
    if (window.renaissanceCourses && document.getElementById('course-grid')) {
        const grid = document.getElementById('course-grid');
        const modal = new LectureModal();

        // Clear existing static content if any (optional, but good for clean slate)
        grid.innerHTML = '';

        window.renaissanceCourses.forEach((lesson, index) => {
            const card = document.createElement('div');
            card.className = "group bg-white rounded-xl border border-purple-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer";
            card.innerHTML = `
                <div class="aspect-[16/9] bg-purple-100 relative overflow-hidden">
                    <div class="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style='background-image: url("https://img.youtube.com/vi/${lesson.videoId}/maxresdefault.jpg");'>
                    </div>
                    <div class="absolute inset-0 bg-purple-900/0 group-hover:bg-purple-900/20 transition-colors flex items-center justify-center">
                         <span class="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 text-5xl drop-shadow-lg transition-all transform scale-50 group-hover:scale-100">play_circle</span>
                    </div>
                </div>
                <div class="p-5">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-purple-500">Lesson ${index + 1}</span>
                        <span class="w-1 h-1 rounded-full bg-purple-300"></span>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-purple-400">${lesson.category}</span>
                    </div>
                    <h3 class="text-lg font-serif-display font-bold text-purple-900 mb-2 group-hover:text-purple-700 transition-colors line-clamp-1">${lesson.title}</h3>
                    <p class="text-sm text-purple-600/70 font-serif-body mb-4 line-clamp-2">${lesson.description}</p>
                    <div class="flex items-center justify-between border-t border-purple-50 pt-3">
                        <div class="flex items-center gap-1 text-purple-400 text-xs">
                            <span class="material-symbols-outlined text-[14px]">schedule</span>
                            <span>${lesson.duration}</span>
                        </div>
                        <span class="text-xs font-bold text-purple-600 group-hover:underline">Start Lesson</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => modal.open(lesson));
            grid.appendChild(card);
        });

        // Also wire up "Resume Lesson" button in hero
        const resumeBtn = document.querySelector('.resume-lesson-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => modal.open(window.renaissanceCourses[0]));
        }
    }

    // 4. Capture Page
    if (document.getElementById('drop-zone')) {
        new DragDropZone('drop-zone', 'file-upload');
    }

    // Capture Buttons
    const btnCamera = document.getElementById('btn-camera');
    if (btnCamera) {
        btnCamera.addEventListener('click', () => {
            if (window.renaissanceSettings) {
                window.renaissanceSettings.showNotification('Camera access requested. (Simulation)', 'info');
            }
        });
    }
    const btnUrl = document.getElementById('btn-url');
    if (btnUrl) {
        btnUrl.addEventListener('click', () => {
            // Simple prompt simulation
            const url = prompt("Enter Image URL:");
            if (url) {
                if (window.renaissanceSettings) {
                    window.renaissanceSettings.showNotification('URL Loaded. Processing...', 'info');
                }
                setTimeout(() => {
                    window.location.href = 'processing.html';
                }, 1000);
            }
        });
    }
});
