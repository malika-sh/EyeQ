from flask import Flask, render_template, request, redirect, url_for
import torch
import os
import csv
from PIL import Image
from torchvision import transforms
from captum.attr import LayerGradCam
import matplotlib.pyplot as plt
import numpy as np

# ------------------- SETUP -------------------
app = Flask(__name__)
UPLOAD_FOLDER = 'static/images'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ------------------- LOAD MODEL -------------------
from model import CNNViT  # Ensure model.py is present in the same folder
model = CNNViT(num_classes=5)
model.load_state_dict(torch.load("static/model/dr_hybrid_vit_model.pt", map_location=torch.device('cpu')))
model.eval()

# Label mapping
classes = {
    0: "No DR",
    1: "Mild",
    2: "Moderate",
    3: "Severe",
    4: "Proliferative DR"
}

# ------------------- GRADCAM FUNCTION -------------------
def generate_gradcam(model, input_tensor, image_path):
    target_layer = model.cnn_backbone.model.blocks[-1]  # Last conv block before ViT
    gradcam = LayerGradCam(model, target_layer)

    pred_class = torch.argmax(model(input_tensor)).item()
    attr = gradcam.attribute(input_tensor, target=pred_class)
    upsampled_attr = torch.nn.functional.interpolate(attr,
                                                     size=(224, 224),
                                                     mode='bilinear')

    heatmap = upsampled_attr.squeeze().detach().numpy()
    heatmap_norm = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min())
    heatmap_color = plt.cm.jet(heatmap_norm)[..., :3]

    original = Image.open(image_path).resize((224, 224))
    original_np = np.array(original).astype(float) / 255.0
    overlay = (heatmap_color * 0.5 + original_np * 0.5)

    overlay_img = Image.fromarray((overlay * 255).astype(np.uint8))
    overlay_path = os.path.join(app.config['UPLOAD_FOLDER'], 'gradcam_overlay.png')
    overlay_img.save(overlay_path)

# ------------------- HOME PAGE -------------------
@app.route('/')
def index():
    return render_template('index.html', prediction=None)

# ------------------- PREDICT ROUTE -------------------
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return redirect(request.url)
    image_file = request.files['image']
    if image_file.filename == '':
        return redirect(request.url)

    path = os.path.join(app.config['UPLOAD_FOLDER'], 'uploaded_image.png')
    image_file.save(path)

    # Preprocess
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    img = Image.open(path).convert("RGB")
    input_tensor = transform(img).unsqueeze(0)

    # Predict
    with torch.no_grad():
        output = model(input_tensor)
        probs = torch.softmax(output, dim=1)
        pred_class = probs.argmax().item()
        confidence = probs.max().item()

    prediction = f"{classes[pred_class]} ({confidence*100:.2f}%)"

    # Generate GradCAM for the current image
    generate_gradcam(model, input_tensor, path)

    return render_template('index.html',
                           prediction=prediction,
                           image_path='static/images/uploaded_image.png',
                           heatmap_path='static/images/gradcam_overlay.png')

# ------------------- FEEDBACK ROUTE -------------------
@app.route('/feedback', methods=['POST'])
def feedback():
    correct = request.form.get("correct")
    corrected_label = request.form.get("corrected_label")

    with open("feedback.csv", mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([correct, corrected_label])

    return redirect(url_for('index'))

# ------------------- MAIN -------------------
if __name__ == '__main__':
    app.run(debug=True)
