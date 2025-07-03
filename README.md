# 👁 EyeQ – AI-Powered Eye Disease Diagnosis Web App

*EyeQ* is an intelligent AI-based web application that assists ophthalmologists in diagnosing retinal diseases using deep learning models and explainability tools like GradCAM. Designed with a doctor-in-the-loop feedback system, EyeQ evolves over time, improving its accuracy and trustworthiness with every use.

---

## 🚀 Features

- 🧠 Diagnoses multiple eye diseases (starting with Diabetic Retinopathy)
- 🤖 Built using CNN + ViT (Vision Transformer) hybrid architecture
- 🔍 Visual explainability with GradCAM
- 👩‍⚕ Feedback system for doctors to mark prediction as correct/incorrect
- 📊 Stores feedback data for future retraining
- 🌐 Clean, simple web interface (Flask + HTML)

---

## 🛠 Tech Stack

- *Modeling*: PyTorch, Google Colab
- *Backend*: Flask (Python)
- *Frontend*: HTML5, CSS3, JavaScript
- *Explainability*: GradCAM / Captum
- *Editor*: VS Code
- *Platform*: Windows (Dell Latitude 5490, 64-bit, 8GB RAM)

---

## 📂 Project Structure

```bash
EyeQ/
├── app.py                # Main Flask application
├── model/                # Trained model weights (.pt)
├── data/                 # Input images / feedback data
├── notebooks/            # Colab training notebooks
├── templates/            # HTML templates
├── static/               # GradCAM images, styles
├── utils/                # Helper scripts (preprocessing, GradCAM, etc.)
├── requirements.txt      # Python dependencies
├── README.md
└── LICENSE

```
---

## ⚙ Local Setup
Prerequisite: Python 3.10+ and VS Code installed on Windows


- 1. Clone this repo
git clone https://github.com/malika-sh/EyeQ.git
cd EyeQ

- 2. (Optional but recommended) Set up virtual environment
python -m venv venv
venv\Scripts\activate

- 3. Install dependencies
pip install -r requirements.txt

- 4. Run the web app
python app.py
Open your browser and go to: http://localhost:5000

---
## 📜 License

Licensed under the *MIT License* – see the LICENSE file for full details.
---

## 🤝 Contributing

Pull requests and suggestions are welcome!
If you'd like to contribute or report issues, please open an issue.

## 🙏 Acknowledgements

Built with ❤ as part of a medtech research internship project by Malika & Niomi.

Special thanks to open-source libraries like PyTorch, Flask, Captum, and the Kaggle medical imaging community.

---
## 🌟 Contact

For questions, feedback, or collaboration ideas:
📩 [sharmamalika921@gmail.com]
---



