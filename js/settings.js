/**
 * Renaissance Settings Manager
 * Handles global state for Theme, Accessibility, and Font Size.
 */

class SettingsManager {
    constructor() {
        this.defaults = {
            theme: 'light',
            accent: 'purple',
            reduceMotion: false,
            highContrast: false,
            fontSize: 14 // Base pixel size
        };

        this.settings = this.loadSettings();
        this.init();
    }

    loadSettings() {
        const stored = localStorage.getItem('renaissance_settings');
        return stored ? { ...this.defaults, ...JSON.parse(stored) } : this.defaults;
    }

    saveSettings() {
        localStorage.setItem('renaissance_settings', JSON.stringify(this.settings));
        this.showNotification('Settings saved successfully');
    }

    resetSettings() {
        this.settings = { ...this.defaults };
        this.saveSettings();
        this.applyAllSettings();
        this.updateUI(); // If on controls page
    }

    init() {
        // Apply settings immediately on load
        this.applyAllSettings();
        this.injectGlobalStyles();
        this.initGlobalInteractions();

        // If we are on the controls page, attach event listeners
        if (document.getElementById('save-changes')) {
            this.initControlsPage();
        }
    }

    applyAllSettings() {
        this.applyTheme(this.settings.theme);
        this.applyAccent(this.settings.accent);
        this.applyMotion(this.settings.reduceMotion);
        this.applyContrast(this.settings.highContrast);
        this.applyFontSize(this.settings.fontSize);
    }

    // --- Applicators ---

    applyTheme(theme) {
        // Remove existing class
        document.documentElement.classList.remove('dark');

        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        }

        // Ensure no leftover filters
        document.body.style.filter = '';
    }

    applyAccent(color) {
        // This is tricky with Tailwind pre-compiled classes. 
        // We'll set a CSS variable that can be used if we refactor to use variables,
        // or we just rely on the stored value for logic. 
        // For this implementation, we'll store it but visual changes might require 
        // replacing classes if not using CSS vars. 
        // Let's set a CSS variable for custom components.
        const colors = {
            purple: '#8776aa',
            pink: '#f497b5', // Example
            blue: '#60a5fa'
        };
        document.documentElement.style.setProperty('--accent-color', colors[color] || colors.purple);
    }

    applyMotion(reduce) {
        if (reduce) {
            document.documentElement.classList.add('reduce-motion');
            // Inject a style tag to force reduce motion if not handled by CSS class
            if (!document.getElementById('motion-style')) {
                const style = document.createElement('style');
                style.id = 'motion-style';
                style.textContent = `*, *::before, *::after { animation-duration: 0.001s !important; transition-duration: 0.001s !important; }`;
                document.head.appendChild(style);
            }
        } else {
            document.documentElement.classList.remove('reduce-motion');
            const style = document.getElementById('motion-style');
            if (style) style.remove();
        }
    }

    applyContrast(highContrast) {
        if (highContrast) {
            document.documentElement.classList.add('high-contrast');
            document.body.style.filter = 'contrast(1.2)';
        } else {
            document.documentElement.classList.remove('high-contrast');
            document.body.style.filter = this.settings.theme === 'sepia' ? 'sepia(0.3)' : '';
        }
    }

    applyFontSize(size) {
        document.documentElement.style.fontSize = `${size}px`;
    }

    // --- UI Interaction (Controls Page) ---

    initControlsPage() {
        console.log('Initializing Settings UI...');

        // Theme Buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.settings.theme = btn.dataset.value;
                this.updateUI(); // Visual selection state
                this.applyTheme(this.settings.theme);
            });
        });

        // Accent Buttons
        document.querySelectorAll('.accent-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.settings.accent = btn.dataset.color;
                this.updateUI();
                this.applyAccent(this.settings.accent);
            });
        });

        // Toggles
        const motionToggle = document.getElementById('reduce-motion');
        if (motionToggle) {
            motionToggle.checked = this.settings.reduceMotion;
            motionToggle.addEventListener('change', (e) => {
                this.settings.reduceMotion = e.target.checked;
                this.applyMotion(this.settings.reduceMotion);
            });
        }

        const contrastToggle = document.getElementById('high-contrast');
        if (contrastToggle) {
            contrastToggle.checked = this.settings.highContrast;
            contrastToggle.addEventListener('change', (e) => {
                this.settings.highContrast = e.target.checked;
                this.applyContrast(this.settings.highContrast);
            });
        }

        // Slider - Use 'change' instead of 'input' to prevent flashing
        const fontSlider = document.getElementById('font-size');
        if (fontSlider) {
            fontSlider.value = this.settings.fontSize;
            fontSlider.addEventListener('change', (e) => {
                let size = parseInt(e.target.value);
                // Strict bounds check
                if (size < 14) size = 14;
                if (size > 18) size = 18;

                this.settings.fontSize = size;
                this.applyFontSize(this.settings.fontSize);
            });
        }

        // Action Buttons
        document.getElementById('save-changes').addEventListener('click', () => this.saveSettings());
        document.getElementById('reset-defaults').addEventListener('click', () => this.resetSettings());

        this.updateUI();
    }

    updateUI() {
        // Update visual state of buttons based on current settings

        // Theme
        document.querySelectorAll('.theme-btn').forEach(btn => {
            if (btn.dataset.value === this.settings.theme) {
                btn.classList.add('bg-white', 'shadow-sm', 'text-purple-900', 'font-bold');
                btn.classList.remove('text-purple-600', 'hover:bg-white/50');
            } else {
                btn.classList.remove('bg-white', 'shadow-sm', 'text-purple-900', 'font-bold');
                btn.classList.add('text-purple-600', 'hover:bg-white/50');
            }
        });

        // Accent
        document.querySelectorAll('.accent-btn').forEach(btn => {
            const isActive = btn.dataset.color === this.settings.accent;
            // Reset rings
            btn.classList.remove('ring-2', 'ring-offset-2');
            if (isActive) {
                btn.classList.add('ring-2', 'ring-offset-2');
            }
        });
    }

    showNotification(message, type = 'info') {
        // Create container if not exists
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(container);
        }

        const notif = document.createElement('div');
        // Tailwind classes for a nice glassmorphism toast
        const bgColor = type === 'error' ? 'bg-red-900/90' : 'bg-gray-900/90';
        notif.className = `${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md transform transition-all duration-300 translate-y-10 opacity-0 pointer-events-auto flex items-center gap-3 border border-white/10`;

        // Icon based on type
        const icon = type === 'error' ? 'error' : 'info';
        notif.innerHTML = `
            <span class="material-symbols-outlined text-sm opacity-70">${icon}</span>
            <span class="font-medium text-sm tracking-wide">${message}</span>
        `;

        container.appendChild(notif);

        // Animate in
        requestAnimationFrame(() => {
            notif.classList.remove('translate-y-10', 'opacity-0');
        });

        // Animate out
        setTimeout(() => {
            notif.classList.add('translate-y-4', 'opacity-0');
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }

    injectGlobalStyles() {
        if (document.getElementById('renaissance-global-styles')) return;

        const style = document.createElement('style');
        style.id = 'renaissance-global-styles';
        style.textContent = `
            /* Global Button Micro-interactions */
            button, .btn, a[role="button"] {
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            button:active, .btn:active, a[role="button"]:active {
                transform: scale(0.96);
            }

            /* Add subtle texture/shading to primary buttons if they don't have it */
            button[class*="bg-"], .btn[class*="bg-"] {
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            
            button[class*="bg-"]:hover, .btn[class*="bg-"]:hover {
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                filter: brightness(1.05);
            }

            /* Unimplemented visual cue */
            [data-action="unimplemented"] {
                cursor: not-allowed;
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);
    }

    initGlobalInteractions() {
        // Delegate clicks for unimplemented features
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action="unimplemented"]');
            if (target) {
                e.preventDefault();
                e.stopPropagation();
                this.showNotification(target.dataset.message || 'This feature is coming soon!', 'info');
            }
        });
    }
}

// Initialize
window.renaissanceSettings = new SettingsManager();
