/**
 * Renaissance Canvas Engine v2
 * Professional art study canvas with full feature set
 */

class RenaissanceCanvas {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;

        // Tools
        this.tool = 'brush';
        this.brushSize = 8;
        this.brushColor = '#2d2434';

        // View state (NO CSS TRANSFORMS - fixes zoom issue)
        this.isFlipped = false;

        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;

        // Keyboard state
        this.spacePressed = false;
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.panOffset = { x: 0, y: 0 };

        this.init();
    }

    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'absolute inset-0 w-full h-full touch-none';
        this.canvas.style.cursor = 'crosshair';
        this.canvas.style.backgroundColor = '#ffffff';

        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Fill with white initially
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Pointer events
        this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
        this.canvas.addEventListener('pointerleave', (e) => this.onPointerUp(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Save initial state
        this.saveState();
        this.updateCursor();
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        const prevData = this.historyIndex >= 0 ? this.canvas.toDataURL() : null;

        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Refill white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Restore previous content
        if (prevData) {
            const img = new Image();
            img.onload = () => this.ctx.drawImage(img, 0, 0);
            img.src = prevData;
        }
    }

    // --- Coordinate Helpers ---
    getCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        // If flipped, invert x coordinate
        if (this.isFlipped) {
            x = this.canvas.width - x;
        }

        return { x, y };
    }

    // --- Pointer Events ---
    onPointerDown(e) {
        const coords = this.getCoords(e);

        // Space + click = pan (but we're removing zoom, so just ignore pan for now)
        if (this.spacePressed) {
            return;
        }

        this.isDrawing = true;
        this.canvas.setPointerCapture(e.pointerId);
        this.lastX = coords.x;
        this.lastY = coords.y;

        // Draw initial dot
        this.ctx.beginPath();
        this.ctx.arc(coords.x, coords.y, this.brushSize / 2, 0, Math.PI * 2);

        if (this.tool === 'eraser') {
            this.ctx.fillStyle = '#ffffff';
        } else {
            this.ctx.fillStyle = this.brushColor;
        }
        this.ctx.fill();
    }

    onPointerMove(e) {
        if (!this.isDrawing) return;

        const coords = this.getCoords(e);
        this.draw(this.lastX, this.lastY, coords.x, coords.y);
        this.lastX = coords.x;
        this.lastY = coords.y;
    }

    onPointerUp(e) {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }

    // --- Drawing ---
    draw(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = this.brushSize;

        if (this.tool === 'eraser') {
            this.ctx.strokeStyle = '#ffffff';
        } else {
            this.ctx.strokeStyle = this.brushColor;
        }

        this.ctx.stroke();
    }

    // --- History (Undo/Redo) ---
    saveState() {
        // Remove future states if we're in the middle of history
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Add current state
        this.history.push(this.canvas.toDataURL());
        this.historyIndex++;

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyIndex--;
        }

        this.updateHistoryButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState();
        }
    }

    restoreState() {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            this.updateHistoryButtons();
        };
        img.src = this.history[this.historyIndex];
    }

    updateHistoryButtons() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');

        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
            undoBtn.classList.toggle('opacity-40', this.historyIndex <= 0);
        }
        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.history.length - 1;
            redoBtn.classList.toggle('opacity-40', this.historyIndex >= this.history.length - 1);
        }
    }

    // --- Tools ---
    setTool(tool) {
        this.tool = tool;
        this.updateCursor();
        this.updateToolButtons();
    }

    setBrushSize(size) {
        this.brushSize = Math.max(1, Math.min(100, size));
        this.updateBrushSizeUI();
    }

    setBrushColor(color) {
        this.brushColor = color;
        this.updateColorUI();
    }

    updateCursor() {
        if (this.tool === 'eraser') {
            // Circle cursor representing eraser size
            const size = Math.max(this.brushSize, 8);
            this.canvas.style.cursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 1}' fill='none' stroke='%23666' stroke-width='1'/></svg>") ${size / 2} ${size / 2}, crosshair`;
        } else {
            // Crosshair with dot for brush
            this.canvas.style.cursor = 'crosshair';
        }
    }

    updateToolButtons() {
        ['tool-draw', 'tool-erase'].forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;

            const isActive = (id === 'tool-draw' && this.tool === 'brush') ||
                (id === 'tool-erase' && this.tool === 'eraser');

            btn.classList.toggle('bg-white', isActive);
            btn.classList.toggle('shadow-sm', isActive);
            btn.classList.toggle('text-purple-900', isActive);
            btn.classList.toggle('text-purple-600', !isActive);
        });
    }

    updateBrushSizeUI() {
        const slider = document.getElementById('brush-size-slider');
        const label = document.getElementById('brush-size-label');
        if (slider) slider.value = this.brushSize;
        if (label) label.textContent = this.brushSize + 'px';
    }

    updateColorUI() {
        const picker = document.getElementById('color-picker');
        const preview = document.getElementById('color-preview');
        if (picker) picker.value = this.brushColor;
        if (preview) preview.style.backgroundColor = this.brushColor;
    }

    // --- View Controls ---
    flipView() {
        this.isFlipped = !this.isFlipped;
        this.canvas.style.transform = this.isFlipped ? 'scaleX(-1)' : '';

        const btn = document.getElementById('btn-flip');
        if (btn) {
            btn.classList.toggle('bg-purple-100', this.isFlipped);
            btn.classList.toggle('text-purple-700', this.isFlipped);
        }
    }

    clearCanvas() {
        if (confirm('Clear the entire canvas? This cannot be undone.')) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
        }
    }

    saveImage() {
        // Create a temporary canvas without flip
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        if (this.isFlipped) {
            tempCtx.translate(tempCanvas.width, 0);
            tempCtx.scale(-1, 1);
        }
        tempCtx.drawImage(this.canvas, 0, 0);

        const link = document.createElement('a');
        link.download = 'renaissance-study.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();

        if (window.renaissanceSettings) {
            window.renaissanceSettings.showNotification('Image saved!', 'info');
        }
    }

    // --- Keyboard Shortcuts ---
    onKeyDown(e) {
        // Only when not typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.code === 'Space') {
            this.spacePressed = true;
            e.preventDefault();
        }

        if (e.code === 'KeyB') {
            this.setTool('brush');
        }

        if (e.code === 'KeyE') {
            this.setTool('eraser');
        }

        if (e.code === 'BracketLeft') {
            this.setBrushSize(this.brushSize - 4);
        }

        if (e.code === 'BracketRight') {
            this.setBrushSize(this.brushSize + 4);
        }

        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
            e.preventDefault();
            if (e.shiftKey) {
                this.redo();
            } else {
                this.undo();
            }
        }

        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
            e.preventDefault();
            this.redo();
        }
    }

    onKeyUp(e) {
        if (e.code === 'Space') {
            this.spacePressed = false;
        }
    }
}

// Global instance
window.renaissanceCanvas = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('main-canvas')) {
        window.renaissanceCanvas = new RenaissanceCanvas('main-canvas');
        setupStudioUI();
    }
});

function setupStudioUI() {
    const canvas = window.renaissanceCanvas;
    if (!canvas) return;

    const bind = (id, action) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', action);
    };

    // Tool buttons
    bind('tool-draw', () => canvas.setTool('brush'));
    bind('tool-erase', () => canvas.setTool('eraser'));

    // Undo/Redo
    bind('btn-undo', () => canvas.undo());
    bind('btn-redo', () => canvas.redo());

    // Flip view
    bind('btn-flip', () => canvas.flipView());

    // Clear canvas
    bind('btn-clear', () => canvas.clearCanvas());

    // Save
    bind('action-save', () => canvas.saveImage());

    // Color picker
    const colorPicker = document.getElementById('color-picker');
    if (colorPicker) {
        colorPicker.value = canvas.brushColor;
        colorPicker.addEventListener('input', (e) => {
            canvas.setBrushColor(e.target.value);
        });
    }

    // Brush size slider
    const sizeSlider = document.getElementById('brush-size-slider');
    const sizeLabel = document.getElementById('brush-size-label');
    if (sizeSlider) {
        sizeSlider.value = canvas.brushSize;
        sizeSlider.addEventListener('input', (e) => {
            canvas.setBrushSize(parseInt(e.target.value));
        });
    }
    if (sizeLabel) {
        sizeLabel.textContent = canvas.brushSize + 'px';
    }

    // Reference image controls
    const refImg = document.getElementById('ref-image');
    if (refImg) {
        bind('ref-toggle', () => {
            refImg.classList.toggle('opacity-0');
            const icon = document.querySelector('#ref-toggle span');
            if (icon) icon.textContent = refImg.classList.contains('opacity-0') ? 'visibility_off' : 'visibility';
        });
        bind('ref-bw', () => {
            refImg.classList.toggle('grayscale');
        });
    }

    // View options
    const mainContainer = document.querySelector('main');

    const checkGrid = document.getElementById('check-grid');
    if (checkGrid && mainContainer) {
        checkGrid.addEventListener('change', (e) => {
            mainContainer.classList.toggle('bg-grid-pattern', e.target.checked);
        });
    }

    const checkGuides = document.getElementById('check-guides');
    if (checkGuides) {
        checkGuides.addEventListener('change', (e) => {
            const guide = document.getElementById('construct-guide');
            if (guide) guide.style.display = e.target.checked ? '' : 'none';
        });
    }

    const checkGhosting = document.getElementById('check-ghosting');
    if (checkGhosting) {
        checkGhosting.addEventListener('change', (e) => {
            const ghost = document.getElementById('ghosting-guide');
            if (ghost) ghost.classList.toggle('hidden', !e.target.checked);
        });
    }

    // Layer opacity
    const rangeOpacity = document.getElementById('range-opacity');
    const valOpacity = document.getElementById('val-opacity');
    if (rangeOpacity) {
        rangeOpacity.addEventListener('input', (e) => {
            const val = e.target.value;
            if (valOpacity) valOpacity.textContent = val + '%';
            canvas.canvas.style.opacity = val / 100;
        });
    }

    // Progression checklist
    document.querySelectorAll('.progression-step').forEach((step, index) => {
        step.dataset.stepNumber = index + 1;

        step.addEventListener('click', () => {
            const isComplete = step.dataset.status === 'complete';
            const indicator = step.querySelector('.step-indicator');
            const title = step.querySelector('h4');

            if (isComplete) {
                step.dataset.status = 'pending';
                indicator.classList.remove('bg-purple-600', 'text-white', 'shadow-sm');
                indicator.classList.add('bg-white', 'border-2', 'border-purple-300', 'text-purple-400');
                indicator.innerHTML = step.dataset.stepNumber;
                title.classList.remove('line-through', 'opacity-70');
            } else {
                step.dataset.status = 'complete';
                indicator.classList.remove('bg-white', 'border-2', 'border-purple-300', 'text-purple-400');
                indicator.classList.add('bg-purple-600', 'text-white', 'shadow-sm');
                indicator.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span>';
                title.classList.add('line-through', 'opacity-70');
            }
        });
    });

    // Initial UI state
    canvas.updateToolButtons();
    canvas.updateHistoryButtons();
}
