import torch
from torch import tensor, no_grad
from torch.nn import Module
from pathlib import Path
from .train_hotspot import HotspotNet

model = HotspotNet()
# Load weights with CPU map to avoid CUDA dependency in local envs
state = torch.load(Path(__file__).with_name("hotspot_model.pt"), map_location="cpu")
model.load_state_dict(state)
model.eval()

def predict(features: list[float]) -> float:
    with no_grad():
        return model(tensor(features).unsqueeze(0)).item() 