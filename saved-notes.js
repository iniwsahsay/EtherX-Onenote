// Saved Notes Functionality
class SavedNotesManager {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('etherx-saved-notes') || '[]');
        this.currentSearchTerm = '';
        this.init();
    }

    init() {
        this.createSavedNotesSection();
        this.bindEvents();
        this.renderNotes();
    }

    createSavedNotesSection() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        const savedNotesHTML = `
            <div class="saved-notes-section">
                <div class="saved-notes-header">
                    <h3 class="saved-notes-title">📝 Saved Notes</h3>
                    <button class="create-note-btn" id="createNewNote">
                        <i class="fas fa-plus"></i> Create New Note
                    </button>
                </div>
                <div id="savedNotesContainer">
                    <!-- Notes will be rendered here -->
                </div>
            </div>
        `;

        // Insert after note controls
        const noteControls = document.querySelector('.note-controls');
        if (noteControls) {
            noteControls.insertAdjacentHTML('afterend', savedNotesHTML);
        }
    }

    bindEvents() {
        // Create new note button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'createNewNote' || e.target.closest('#createNewNote')) {
                this.createNewNote();
            }
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearchTerm = e.target.value.toLowerCase();
                this.renderNotes();
            });
        }

        // Note card clicks
        document.addEventListener('click', (e) => {
            const noteCard = e.target.closest('.saved-note-card');
            if (noteCard && !e.target.closest('.note-action-btn')) {
                const noteId = noteCard.dataset.noteId;
                this.openNote(noteId);
            }
        });

        // Note action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-note-btn')) {
                const noteId = e.target.closest('.saved-note-card').dataset.noteId;
                this.deleteNote(noteId);
            }
            if (e.target.closest('.edit-note-btn')) {
                const noteId = e.target.closest('.saved-note-card').dataset.noteId;
                this.openNote(noteId);
            }
        });

        // Save note when editor is used
        this.bindSaveEvents();
    }

    bindSaveEvents() {
        // Auto-save when note content changes
        const noteTitle = document.getElementById('noteTitle');
        const noteContent = document.getElementById('noteContent');
        const tagInput = document.getElementById('Tag');

        if (noteTitle) {
            noteTitle.addEventListener('blur', () => this.autoSave());
        }
        if (noteContent) {
            noteContent.addEventListener('blur', () => this.autoSave());
        }
        if (tagInput) {
            tagInput.addEventListener('blur', () => this.autoSave());
        }

        // Save button in editor
        document.addEventListener('click', (e) => {
            if (e.target.id === 'saveNoteBtn' || e.target.closest('#saveNoteBtn')) {
                this.saveCurrentNote();
            }
        });
    }

    createNewNote() {
        // Clear editor
        const noteTitle = document.getElementById('noteTitle');
        const noteContent = document.getElementById('noteContent');
        const tagInput = document.getElementById('Tag');

        if (noteTitle) noteTitle.value = '';
        if (noteContent) noteContent.innerHTML = '';
        if (tagInput) tagInput.value = '';

        // Open editor
        this.openEditor();
        
        // Focus on title
        if (noteTitle) {
            noteTitle.focus();
            noteTitle.placeholder = 'Enter note title...';
        }
    }

    openEditor() {
        const editor = document.querySelector('.note-editor');
        if (editor) {
            editor.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeEditor() {
        const editor = document.querySelector('.note-editor');
        if (editor) {
            editor.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    saveCurrentNote() {
        const noteTitle = document.getElementById('noteTitle');
        const noteContent = document.getElementById('noteContent');
        const tagInput = document.getElementById('Tag');

        const title = noteTitle?.value.trim() || 'Untitled Note';
        const content = noteContent?.innerHTML || '';
        const tags = tagInput?.value.trim() || '';

        if (!content.trim() && !title.trim()) {
            this.showMessage('Please add some content to save the note.', 'error');
            return;
        }

        const note = {
            id: Date.now().toString(),
            title: title,
            content: content,
            tags: tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(note);
        this.saveToStorage();
        this.renderNotes();
        this.closeEditor();
        this.showMessage('Note saved successfully!', 'success');
    }

    autoSave() {
        const noteTitle = document.getElementById('noteTitle');
        const noteContent = document.getElementById('noteContent');
        
        if (noteTitle?.value.trim() || noteContent?.innerHTML.trim()) {
            // Only auto-save if there's content
            setTimeout(() => this.saveCurrentNote(), 1000);
        }
    }

    openNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        const noteTitle = document.getElementById('noteTitle');
        const noteContent = document.getElementById('noteContent');
        const tagInput = document.getElementById('Tag');

        if (noteTitle) noteTitle.value = note.title;
        if (noteContent) noteContent.innerHTML = note.content;
        if (tagInput) tagInput.value = note.tags;

        this.openEditor();
    }

    deleteNote(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            this.notes = this.notes.filter(n => n.id !== noteId);
            this.saveToStorage();
            this.renderNotes();
            this.showMessage('Note deleted successfully!', 'success');
        }
    }

    renderNotes() {
        const container = document.getElementById('savedNotesContainer');
        if (!container) return;

        let filteredNotes = this.notes;

        // Filter by search term
        if (this.currentSearchTerm) {
            filteredNotes = this.notes.filter(note => 
                note.title.toLowerCase().includes(this.currentSearchTerm) ||
                note.content.toLowerCase().includes(this.currentSearchTerm) ||
                note.tags.toLowerCase().includes(this.currentSearchTerm)
            );
        }

        if (filteredNotes.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        const notesHTML = `
            <div class="notes-grid">
                ${filteredNotes.map(note => this.renderNoteCard(note)).join('')}
            </div>
        `;

        container.innerHTML = notesHTML;
    }

    renderNoteCard(note) {
        const preview = this.getTextPreview(note.content);
        const highlightedTitle = this.highlightSearchTerm(note.title);
        const highlightedPreview = this.highlightSearchTerm(preview);
        const date = new Date(note.createdAt).toLocaleDateString();

        return `
            <div class="saved-note-card" data-note-id="${note.id}">
                <div class="saved-note-title">${highlightedTitle}</div>
                <div class="saved-note-preview">${highlightedPreview}</div>
                <div class="saved-note-meta">
                    <span class="saved-note-date">${date}</span>
                    <div class="saved-note-actions">
                        <button class="note-action-btn edit-note-btn" title="Edit Note">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="note-action-btn delete-note-btn" title="Delete Note">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getTextPreview(htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        return text.length > 150 ? text.substring(0, 150) + '...' : text;
    }

    highlightSearchTerm(text) {
        if (!this.currentSearchTerm) return text;
        
        const regex = new RegExp(`(${this.currentSearchTerm})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    getEmptyState() {
        if (this.currentSearchTerm) {
            return `
                <div class="no-notes-message">
                    <div class="no-notes-icon">🔍</div>
                    <h4>No notes found</h4>
                    <p>No notes match your search for "${this.currentSearchTerm}"</p>
                </div>
            `;
        }

        return `
            <div class="no-notes-message">
                <div class="no-notes-icon">📝</div>
                <h4>No saved notes yet</h4>
                <p>Click "Create New Note" to get started!</p>
            </div>
        `;
    }

    saveToStorage() {
        localStorage.setItem('etherx-saved-notes', JSON.stringify(this.notes));
    }

    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('noteMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'noteMessage';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: #1B1A17;
                font-weight: 500;
                z-index: 10000;
                transition: all 0.3s ease;
                background: linear-gradient(135deg, #FFD700, #FFD966, #FFE699);
                border: 1px solid #FFD966;
                box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
            `;
            document.body.appendChild(messageEl);
        }

        messageEl.textContent = message;
        messageEl.style.display = 'block';
        messageEl.style.opacity = '1';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for app to be ready
    setTimeout(() => {
        if (document.querySelector('.app-container')) {
            new SavedNotesManager();
        }
    }, 1000);
});

// Also initialize when app becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && document.querySelector('.app-container') && !window.savedNotesManager) {
        window.savedNotesManager = new SavedNotesManager();
    }
});