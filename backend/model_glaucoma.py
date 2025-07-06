# model_glaucoma.py
import torch
from transformers import AutoImageProcessor, Swinv2ForImageClassification

# Load processor + model
glaucoma_processor = AutoImageProcessor.from_pretrained("pamixsun/swinv2_tiny_for_glaucoma_classification")
glaucoma_model = Swinv2ForImageClassification.from_pretrained("pamixsun/swinv2_tiny_for_glaucoma_classification")
glaucoma_model.eval()

# Extract labels from config
glaucoma_labels = glaucoma_model.config.id2label
