# gradcam.py
import torch
import torch.nn.functional as F
import numpy as np
import matplotlib.pyplot as plt

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.gradients = None
        self.activations = None
        target_layer.register_forward_hook(self.save_activation)
        target_layer.register_backward_hook(self.save_gradient)
    
    def save_activation(self, module, input, output):
        self.activations = output.detach()
    
    def save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()
    
    def generate(self, input_tensor, target_class=None):
        output = self.model(input_tensor)
        if target_class is None:
            target_class = torch.argmax(output)
        
        self.model.zero_grad()
        one_hot = torch.zeros_like(output)
        one_hot[0][target_class] = 1
        output.backward(gradient=one_hot)
        
        weights = torch.mean(self.gradients, dim=[2, 3], keepdim=True)
        heatmap = torch.sum(self.activations * weights, dim=1).squeeze()
        heatmap = F.relu(heatmap)
        return (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min())

def visualize_gradcam(image, heatmap, save_path='static/gradcam_result.png'):
    plt.figure(figsize=(10,5))
    plt.imshow(image)
    plt.imshow(heatmap, cmap='jet', alpha=0.5)
    plt.axis('off')
    plt.savefig(save_path)
    plt.close()