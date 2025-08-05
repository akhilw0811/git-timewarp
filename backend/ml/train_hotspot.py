import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from sqlalchemy.orm import Session
import sys
import os
import argparse

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import SessionLocal, Snapshot


class HotspotDataset(Dataset):
    """Dataset for hotspot prediction."""
    def __init__(self, X, y):
        self.X = torch.FloatTensor(X)
        self.y = torch.FloatTensor(y)
    
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


class HotspotNet(nn.Module):
    """4→16→1 MLP for hotspot prediction."""
    def __init__(self):
        super(HotspotNet, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(4, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid()
        )
    
    def forward(self, x):
        return self.layers(x)


def load_data(db_url="sqlite:///timewarp.db"):
    """Load snapshots with features and labels from database."""
    session = SessionLocal(db_url)
    try:
        # Load all snapshots where tmp_features is not NULL and label is 0 or 1
        snapshots = session.query(Snapshot).filter(
            Snapshot.tmp_features.isnot(None),
            Snapshot.label.in_([0, 1])
        ).all()
        
        if not snapshots:
            print("No snapshots found with features and labels!")
            return None, None
        
        # Extract features and labels
        features = []
        labels = []
        
        for snapshot in snapshots:
            features.append(snapshot.tmp_features)
            labels.append(snapshot.label)
        
        X = np.array(features, dtype=np.float32)
        y = np.array(labels, dtype=np.float32)
        
        print(f"Loaded {len(X)} samples with {np.sum(y)} positive labels")
        return X, y
        
    finally:
        session.close()


def train_model(X, y, model_path="backend/ml/hotspot_model.pt"):
    """Train the hotspot model."""
    # 80/20 split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Create datasets and dataloaders
    train_dataset = HotspotDataset(X_train, y_train)
    test_dataset = HotspotDataset(X_test, y_test)
    
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)
    
    # Initialize model, loss, and optimizer
    model = HotspotNet()
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    
    print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples")
    print(f"Model architecture: {model}")
    
    # Training loop
    model.train()
    for epoch in range(10):
        total_loss = 0
        for batch_X, batch_y in train_loader:
            optimizer.zero_grad()
            outputs = model(batch_X).squeeze()
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        
        avg_loss = total_loss / len(train_loader)
        print(f"Epoch {epoch+1}/10, Loss: {avg_loss:.4f}")
    
    # Evaluate on test set
    model.eval()
    test_predictions = []
    test_labels = []
    
    with torch.no_grad():
        for batch_X, batch_y in test_loader:
            outputs = model(batch_X).squeeze()
            test_predictions.extend(outputs.numpy())
            test_labels.extend(batch_y.numpy())
    
    # Calculate AUC
    auc = roc_auc_score(test_labels, test_predictions)
    print(f"Test AUC: {auc:.4f}")
    
    # Save model
    torch.save(model.state_dict(), model_path)
    print(f"Model saved to {model_path}")
    
    return model, auc


def main():
    """Main training function."""
    parser = argparse.ArgumentParser(description="Train hotspot prediction model")
    parser.add_argument("--db-url", default="sqlite:///timewarp.db", help="Database URL")
    args = parser.parse_args()
    
    print("Loading data from database...")
    X, y = load_data(args.db_url)
    
    if X is None:
        print("Failed to load data. Exiting.")
        return
    
    print("Training hotspot model...")
    model, auc = train_model(X, y)
    
    print(f"Training complete! Final test AUC: {auc:.4f}")


if __name__ == "__main__":
    main() 