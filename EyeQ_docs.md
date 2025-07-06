# EyeQ: AI-Powered Eye Disease Diagnosis

**Last Updated:** 2025-07-06 09:24:08  
**Author:** Malika Sharma  
**Project Type:** Flask + Vite Frontend + PyTorch AI Models  
**Use Case:** Diabetic Retinopathy and Glaucoma Detection from Fundus Images  
**Explainability:** GradCAM Heatmaps (DR Only)  


## 1. Overview

This application, EyeQ, allows doctors or users to upload a fundus (retina) image and receive predictions for two major eye conditions:

- **Diabetic Retinopathy (DR)**: classified into 5 stages.
- **Glaucoma**: binary classification (Glaucoma or Normal).

The system provides visual explainability via GradCAM for DR only. Users can also submit feedback for each prediction.

## 2. Folder Structure

```
EyeQ/
├── backend/
│   ├── main.py                  # Flask server logic
│   ├── model.py                # CNN-ViT model for DR
│   ├── model_glaucoma.py       # HuggingFace model for Glaucoma
│   ├── templates/
│   │   └── index.html          # Final built frontend (copied from dist/index.html)
│   ├── static/
│   │   ├── images/             # Uploaded and GradCAM images
│   │   └── assets/             # CSS/JS build files from Vite
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── index.html              # Source HTML
│   ├── script.js               # Core JS logic
│   ├── style.css               # Tailwind or custom styling
│   ├── vite.config.ts          # Vite configuration
│   ├── package.json            # NPM project definition
│   └── tsconfig.json           # TypeScript config (if applicable)
└── README.md / docs.md         # Project documentation
```

## 3. Setup Instructions

### A. Backend Setup (Flask)

```bash
cd backend/
pip install -r requirements.txt
python main.py
```

> Make sure models are downloaded into `static/model/`.

---

### B. Frontend Setup (Vite + Tailwind)

```bash
cd frontend/
npm install
npm run dev        # For development
npm run build      # For production
```

After building:
- Copy `dist/index.html` to `backend/templates/index.html`
- Copy `dist/assets/` to `backend/static/assets/`

Then restart Flask.

---

### C. Requirements File (Python)

```text
flask
torch
torchvision
captum
matplotlib
pillow
numpy
timm
transformers
```

> You can regenerate it via:  
```bash
pip freeze > requirements.txt
```

## 4. Key Features Implemented

- Upload retina images via drag/drop or file input
- DR classification using CNN+ViT model
- Glaucoma classification using pretrained Hugging Face SwinV2 model
- GradCAM visualization for DR (not Glaucoma)
- Interactive prediction cards for both diseases
- Doctor feedback interface for correctness and corrected label
- Backend stores feedback in CSV (`dr_feedback.csv`, `glaucoma_feedback.csv`)
- Fully responsive and clean frontend using Vite + Tailwind CSS
- Lazy loading + accessibility + error handling

## 5. Prediction Output Example

Flask `/predict` route returns:

```json
{
  "dr": {
    "prediction": "Mild",
    "confidence": "93.16",
    "heatmap": "/static/images/gradcam_overlay.png",
    "summary": "DR prediction based on retinal lesions, exudates and hemorrhages."
  },
  "glaucoma": {
    "prediction": "Glaucoma",
    "confidence": "96.91",
    "heatmap": "",
    "summary": "Glaucoma classification based on optic disc and retinal nerve fiber features."
  }
}
```

## 6. Datasets Used

- Diabetic Retinopathy:
  - [APTOS 2019](https://www.kaggle.com/c/aptos2019-blindness-detection/data)
  - [EyePACS](https://www.kaggle.com/c/diabetic-retinopathy-detection/data)

- Glaucoma (no DR present):
  - [REFUGE](https://zenodo.org/record/3703974)
  - [DRISHTI-GS1](https://cvit.iiit.ac.in/projects/mip/drishti-gs/mip-dataset2/Home.php)
  - [RIM-ONE DL](https://vibot.cnrs.fr/dataset-rim-one/)
  - [G1020](https://zenodo.org/record/5542916)
  - [ORIGA](https://www.researchgate.net/publication/224161627_ORIGA-Image_Database_for_Glaucoma_Analysis)

## 7. Limitations

- GradCAM is available only for Diabetic Retinopathy (not Glaucoma)
- Image preprocessing is fixed to 224x224
- No database or authentication system
- Only CPU inference supported (for now)
- Glaucoma GradCAM was removed from frontend and handled silently in backend

## 8. Future Enhancements

- Add GradCAM for glaucoma using custom ViT wrapper
- Use database (SQLite/PostgreSQL) instead of CSV for feedback
- Add real-time deployment using Docker + Nginx + Gunicorn
- Expand model to detect Cataract, AMD, Color Blindness
- User login + patient history tracking