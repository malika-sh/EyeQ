import torch
import torch.nn as nn
import timm

class TransformerBlock(nn.Module):
    def __init__(self, embed_dim=1280, num_heads=8, ff_dim=3072, dropout=0.1):
        super(TransformerBlock, self).__init__()
        self.attn = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout)
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.ffn = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Linear(ff_dim, embed_dim),
            nn.Dropout(dropout)
        )

    def forward(self, x):
        x = x.unsqueeze(1)  
        x = x.permute(1, 0, 2)  

        attn_output, _ = self.attn(x, x, x)  
        x = self.norm1(x + attn_output) 

        ffn_output = self.ffn(x)
        x = self.norm2(x + ffn_output) 

        x = x.permute(1, 0, 2) 
        return x

class EfficientNetBackbone(nn.Module):
    def __init__(self):
        super(EfficientNetBackbone, self).__init__()
        self.model = timm.create_model('efficientnet_b0', pretrained=True, num_classes=0, global_pool='avg')
        self.out_features = 1280  

    def forward(self, x):
        x = self.model(x)  
        return x

class CNNViT(nn.Module):
    def __init__(self, num_classes=5):
        super(CNNViT, self).__init__()
        self.cnn_backbone = EfficientNetBackbone()
        self.transformer = TransformerBlock(embed_dim=1280, num_heads=8, ff_dim=3072)

        self.fc = nn.Sequential(
            nn.Linear(1280, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.cnn_backbone(x)  
        x = self.transformer(x) 
        x = x.squeeze(1)         
        x = self.fc(x)   
        return x

model_Hybrid = CNNViT(num_classes=5)
