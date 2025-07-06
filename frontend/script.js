// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadContent = document.getElementById('uploadContent');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const selectButton = document.getElementById('selectButton');
const clearButton = document.getElementById('clearButton');
const predictSection = document.getElementById('predictSection');
const predictButton = document.getElementById('predictButton');
const resultsSection = document.getElementById('resultsSection');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');

// Prediction result elements
const drStatus = document.getElementById('drStatus');
const drConfidence = document.getElementById('drConfidence');
const drConfidenceBar = document.getElementById('drConfidenceBar');
const drSummary = document.getElementById('drSummary');
const drGradcam = document.getElementById('drGradcam');

const glaucomaStatus = document.getElementById('glaucomaStatus');
const glaucomaConfidence = document.getElementById('glaucomaConfidence');
const glaucomaConfidenceBar = document.getElementById('glaucomaConfidenceBar');
const glaucomaSummary = document.getElementById('glaucomaSummary');
const glaucomaGradcam = document.getElementById('glaucomaGradcam');

// Feedback elements
const drFeedbackToggle = document.getElementById('drFeedbackToggle');
const drFeedbackForm = document.getElementById('drFeedbackForm');
const drCorrectLabel = document.getElementById('drCorrectLabel');
const drSubmitFeedback = document.getElementById('drSubmitFeedback');

const glaucomaFeedbackToggle = document.getElementById('glaucomaFeedbackToggle');
const glaucomaFeedbackForm = document.getElementById('glaucomaFeedbackForm');
const glaucomaCorrectLabel = document.getElementById('glaucomaCorrectLabel');
const glaucomaSubmitFeedback = document.getElementById('glaucomaSubmitFeedback');

// State
let selectedFile = null;
let isLoading = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // File input events
    fileInput.addEventListener('change', handleFileSelect);
    selectButton.addEventListener('click', () => fileInput.click());
    clearButton.addEventListener('click', clearImage);
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', handleUploadAreaClick);
    
    // Prediction button
    predictButton.addEventListener('click', handlePredict);
    
    // Feedback toggles
    drFeedbackToggle.addEventListener('click', () => toggleFeedback('dr'));
    glaucomaFeedbackToggle.addEventListener('click', () => toggleFeedback('glaucoma'));
    
    // Feedback form events
    setupFeedbackForm('dr');
    setupFeedbackForm('glaucoma');
    
    // Submit feedback buttons
    drSubmitFeedback.addEventListener('click', () => handleFeedbackSubmit('dr'));
    glaucomaSubmitFeedback.addEventListener('click', () => handleFeedbackSubmit('glaucoma'));
}

// File handling functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && isValidImageFile(file)) {
        processFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const file = event.dataTransfer.files[0];
    if (file && isValidImageFile(file)) {
        processFile(file);
    }
}

function handleUploadAreaClick(event) {
    if (event.target === uploadArea || event.target === uploadContent) {
        fileInput.click();
    }
}

function isValidImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    return validTypes.includes(file.type);
}

function processFile(file) {
    selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        uploadContent.classList.add('hidden');
        imagePreview.classList.remove('hidden');
        predictSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    selectedFile = null;
    fileInput.value = '';
    uploadContent.classList.remove('hidden');
    imagePreview.classList.add('hidden');
    predictSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    previewImage.src = '';
    
    // Reset feedback forms
    resetFeedbackForms();
}

// Prediction functions
async function handlePredict() {
    if (!selectedFile || isLoading) return;

    setLoadingState(true);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
        const response = await fetch("/predict", {
     method: "POST",
     body: formData,
    });

        

        if (!response.ok) throw new Error('Prediction request failed.');

        const data = await response.json();

        displayPredictionResults(data); // Real backend data
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' })
        loadRecentFeedback('dr', 'recentDrFeedback');
        loadRecentFeedback('glaucoma', 'recentGlaucomaFeedback');

    } catch (error) {
        console.error('Prediction error:', error);
        showErrorMessage('Prediction failed. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

async function loadRecentFeedback(disease, containerId) {
    try {
        const res = await fetch(`/feedbacks/${disease}`);
        const feedbacks = await res.json();

        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (feedbacks.length === 0) {
            container.innerHTML = '<p>No feedback yet.</p>';
            return;
        }

        feedbacks.forEach(([timestamp, correct, corrected]) => {
            const item = document.createElement('p');
            item.textContent = `🕒 ${timestamp} - ✅ ${correct} ${corrected ? `→ ${corrected}` : ''}`;
            container.appendChild(item);
        });
    } catch (e) {
        console.error("Failed to load feedbacks:", e);
    }
}



function setLoadingState(loading) {
    isLoading = loading;
    predictButton.disabled = loading;
    
    if (loading) {
        predictButton.classList.add('loading');
        predictButton.querySelector('.predict-text').textContent = 'Analyzing...';
    } else {
        predictButton.classList.remove('loading');
        predictButton.querySelector('.predict-text').textContent = 'Predict';
    }
}

function generateMockPredictions() {
    return {
        diabeticRetinopathy: {
            status: 'Moderate DR',
            confidence: 93.2,
            summary: 'This fundus image shows signs of moderate diabetic retinopathy with visible microaneurysms and hemorrhages. Early intervention is recommended.',
            gradcam: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop'
        },
        glaucoma: {
            status: 'Normal',
            confidence: 87.5,
            summary: 'The optic disc appears normal with healthy cup-to-disc ratio. No signs of glaucomatous changes detected.',
            gradcam: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop'
        }
    };
}

function displayPredictionResults(data) {
    // DR section
    drStatus.textContent = data.dr.prediction;
    drConfidence.textContent = `${data.dr.confidence}%`;
    drGradcam.src = data.dr.heatmap;
    drSummary.textContent = data.dr.summary || "This prediction was made using AI algorithms.";

    drConfidenceBar.style.width = `${data.dr.confidence}%`;

    // Glaucoma section
    if (glaucomaStatus) glaucomaStatus.textContent = data.glaucoma.prediction;
    if (glaucomaConfidence) glaucomaConfidence.textContent = `${data.glaucoma.confidence}%`;
    if (glaucomaGradcam && data.glaucoma.heatmap) glaucomaGradcam.src = data.glaucoma.heatmap;
    if (glaucomaSummary) glaucomaSummary.textContent = data.glaucoma.summary || "AI-assisted analysis of optic nerve region.";
    if (glaucomaConfidenceBar) glaucomaConfidenceBar.style.width = `${data.glaucoma.confidence}%`;

}


// Feedback functions
function toggleFeedback(type) {
    const toggle = type === 'dr' ? drFeedbackToggle : glaucomaFeedbackToggle;
    const form = type === 'dr' ? drFeedbackForm : glaucomaFeedbackForm;
    
    const isVisible = !form.classList.contains('hidden');
    
    if (isVisible) {
        form.classList.add('hidden');
        toggle.classList.remove('active');
    } else {
        form.classList.remove('hidden');
        toggle.classList.add('active');
    }
}

function setupFeedbackForm(type) {
    const correctRadios = document.querySelectorAll(`input[name="${type}-correct"]`);
    const correctLabelSection = document.getElementById(`${type}CorrectLabel`);
    
    correctRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'no') {
                correctLabelSection.classList.remove('hidden');
            } else {
                correctLabelSection.classList.add('hidden');
            }
        });
    });
}

async function handleFeedbackSubmit(type) {
    const correctRadios = document.querySelectorAll(`input[name="${type}-correct"]`);
    const selectedCorrect = Array.from(correctRadios).find(radio => radio.checked);

    if (!selectedCorrect) {
        showErrorMessage('Please select whether the prediction was correct.');
        return;
    }

    const isCorrect = selectedCorrect.value === 'yes';
    let actualLabel = null;

    if (!isCorrect) {
        const actualLabelSelect = document.getElementById(`${type}ActualLabel`);
        actualLabel = actualLabelSelect.value;

        if (!actualLabel) {
            showErrorMessage('Please select the correct label.');
            return;
        }
    }

    const payload = {
        disease: type === 'dr' ? 'Diabetic Retinopathy' : 'Glaucoma',
        correct: selectedCorrect.value,
        corrected_label: actualLabel
    };

    try {
        const response = await fetch('/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        showSuccessMessage(data.message);

        // Reset feedback form
        resetFeedbackForm(type);
    } catch (error) {
        console.error("Feedback error:", error);
        showErrorMessage("Failed to submit feedback. Try again.");
    }
}


function resetFeedbackForms() {
    resetFeedbackForm('dr');
    resetFeedbackForm('glaucoma');
}

function resetFeedbackForm(type) {
    const correctRadios = document.querySelectorAll(`input[name="${type}-correct"]`);
    const correctLabelSection = document.getElementById(`${type}CorrectLabel`);
    const actualLabelSelect = document.getElementById(`${type}ActualLabel`);
    
    // Reset radio buttons to "Yes"
    correctRadios.forEach(radio => {
        radio.checked = radio.value === 'yes';
    });
    
    // Hide correct label section
    correctLabelSection.classList.add('hidden');
    
    // Reset select
    actualLabelSelect.value = '';
    
    // Hide feedback form
    const form = type === 'dr' ? drFeedbackForm : glaucomaFeedbackForm;
    const toggle = type === 'dr' ? drFeedbackToggle : glaucomaFeedbackToggle;
    
    form.classList.add('hidden');
    toggle.classList.remove('active');
}

// Message functions
function showSuccessMessage(message) {
    successText.textContent = message;
    successMessage.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 3000);
    
    // Scroll to top to show message
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showErrorMessage(message) {
    // Create error message element if it doesn't exist
    let errorMessage = document.getElementById('errorMessage');
    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.id = 'errorMessage';
        errorMessage.className = 'error-message hidden';
        errorMessage.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span id="errorText"></span>
        `;
        
        // Add error message styles
        const style = document.createElement('style');
        style.textContent = `
            .error-message {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 1rem;
                border-radius: 0.5rem;
                margin-bottom: 1.5rem;
                animation: slideIn 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
        
        successMessage.parentNode.insertBefore(errorMessage, successMessage.nextSibling);
    }
    
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 3000);
    
    // Scroll to top to show message
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Keyboard navigation support
document.addEventListener('keydown', function(event) {
    // Allow Enter key to trigger file selection
    if (event.key === 'Enter' && event.target === uploadArea) {
        fileInput.click();
    }
    
    // Allow Escape key to clear image
    if (event.key === 'Escape' && selectedFile) {
        clearImage();
    }
});

// Accessibility improvements
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Add screen reader only class
const srOnlyStyle = document.createElement('style');
srOnlyStyle.textContent = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
`;
document.head.appendChild(srOnlyStyle);

// Performance optimization: Lazy load images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lazyLoadImages);
} else {
    lazyLoadImages();
}