import warnings
warnings.filterwarnings("ignore")

import os
import csv
import torch
from PIL import Image
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from torchvision import transforms
from captum.attr import LayerGradCam
import matplotlib.pyplot as plt
from datetime import datetime

from model import CNNViT
from model_glaucoma import glaucoma_model, glaucoma_processor, glaucoma_labels

# ------------------- SETUP -------------------
app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
UPLOAD_FOLDER = "static/images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ------------------- LOAD DR MODEL -------------------
model = CNNViT(num_classes=5)
model_path = os.path.join("static", "model", "dr_hybrid_vit_model.pt")
model.load_state_dict(torch.load(model_path, map_location=torch.device("cpu")))
model.eval()

classes = {
    0: "No DR",
    1: "Mild",
    2: "Moderate",
    3: "Severe",
    4: "Proliferative DR"
}

# ------------------- DR GradCAM -------------------
def generate_gradcam(model, input_tensor, image_path):
    target_layer = model.cnn_backbone.model.blocks[-1]
    gradcam = LayerGradCam(model, target_layer)
    pred_class = torch.argmax(model(input_tensor)).item()
    attr = gradcam.attribute(input_tensor, target=pred_class)
    upsampled_attr = torch.nn.functional.interpolate(attr, size=(224, 224), mode='bilinear')
    heatmap = upsampled_attr.squeeze().detach().numpy()
    heatmap_norm = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min())
    heatmap_color = plt.cm.jet(heatmap_norm)[..., :3]
    original = Image.open(image_path).resize((224, 224))
    original_np = np.array(original).astype(float) / 255.0
    overlay = (heatmap_color * 0.5 + original_np * 0.5)
    overlay_img = Image.fromarray((overlay * 255).astype(np.uint8))
    overlay_img.save(os.path.join(UPLOAD_FOLDER, 'gradcam_overlay.png'))

# ------------------- GLAUCOMA GradCAM -------------------
def generate_glaucoma_gradcam(model, input_tensor, image_path):
    try:
        target_layer = model.base_model.base_model.layernorm
        gradcam = LayerGradCam(model, target_layer)
        pred_class = torch.argmax(model(input_tensor).logits, dim=1).item()
        attr = gradcam.attribute(input_tensor, target=pred_class)
        upsampled_attr = torch.nn.functional.interpolate(attr, size=(224, 224), mode='bilinear')
        heatmap = upsampled_attr.squeeze().detach().numpy()
        heatmap_norm = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min())
        heatmap_color = plt.cm.jet(heatmap_norm)[..., :3]
        original = Image.open(image_path).resize((224, 224))
        original_np = np.array(original).astype(float) / 255.0
        overlay = (heatmap_color * 0.5 + original_np * 0.5)
        overlay_img = Image.fromarray((overlay * 255).astype(np.uint8))
        overlay_img.save(os.path.join(UPLOAD_FOLDER, 'glaucoma_gradcam_overlay.png'))
        return True
    except Exception as e:
        print("[Warning] Glaucoma GradCAM failed:", e)
        return False

# ------------------- ROUTES -------------------

@app.route("/")
def serve_frontend():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image_file = request.files["image"]
    if image_file.filename == "":
        return jsonify({"error": "Empty file name"}), 400

    path = os.path.join(UPLOAD_FOLDER, "uploaded_image.png")
    image_file.save(path)

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    img = Image.open(path).convert("RGB")
    input_tensor = transform(img).unsqueeze(0)

    # DR prediction
    with torch.no_grad():
        dr_output = model(input_tensor)
        dr_probs = torch.softmax(dr_output, dim=1)
        dr_pred_class = dr_probs.argmax().item()
        dr_confidence = dr_probs.max().item()

    generate_gradcam(model, input_tensor, path)
    dr_result = {
        "prediction": classes[dr_pred_class],
        "confidence": f"{dr_confidence * 100:.2f}",
        "heatmap": "/static/images/gradcam_overlay.png",
        "summary": "DR prediction based on retinal lesions, exudates and hemorrhages."
    }

    # Glaucoma prediction
    try:
        hf_inputs = glaucoma_processor(images=img, return_tensors="pt")
        pixel_values = hf_inputs["pixel_values"]
        with torch.no_grad():
            output = glaucoma_model(pixel_values)
            probs = torch.softmax(output.logits, dim=1)
            pred_idx = probs.argmax(-1).item()
            confidence = probs.max().item()
        prediction_glaucoma = glaucoma_labels[pred_idx]
        gradcam_success = generate_glaucoma_gradcam(glaucoma_model, pixel_values, path)
        glau_result = {
            "prediction": prediction_glaucoma,
            "confidence": f"{confidence * 100:.2f}",
            "heatmap": "/static/images/glaucoma_gradcam_overlay.png" if gradcam_success else "",
            "summary": "Glaucoma classification based on optic disc and retinal nerve fiber features."
        }
    except Exception as e:
        glau_result = {
            "prediction": "Error",
            "confidence": "0.00",
            "heatmap": "",
            "summary": f"Glaucoma prediction failed: {str(e)}"
        }

    return jsonify({
        "dr": dr_result,
        "glaucoma": glau_result
    })

@app.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data received"}), 400

    correct = data.get("correct")
    corrected_label = data.get("corrected_label")
    disease_type = data.get("disease")

    filename = f"{disease_type.lower().replace(' ', '_')}_feedback.csv"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with open(filename, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow([timestamp, correct, corrected_label])

    return jsonify({"message": f"{disease_type} feedback saved successfully"})

@app.route("/feedbacks/<disease>")
def get_feedbacks(disease):
    filename = f"{disease.lower().replace(' ', '_')}_feedback.csv"
    feedbacks = []

    try:
        with open(filename, newline="") as f:
            reader = csv.reader(f)
            feedbacks = list(reader)[-5:]
    except FileNotFoundError:
        feedbacks = []

    return jsonify(feedbacks)

# ------------------- RUN -------------------
if __name__ == "__main__":
    print("Starting server...")
    app.run(debug=True)
