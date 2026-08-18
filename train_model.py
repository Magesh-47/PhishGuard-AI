import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.feature_selection import SelectFromModel
import joblib
import warnings
warnings.filterwarnings('ignore')

class PhishingModelTrainer:
    def __init__(self, data_path='data/phishing_dataset.csv'):
        self.data_path = data_path
        self.models = {}
        self.scaler = None
        self.feature_columns = None
        self.best_model = None
        
    def load_and_prepare_data(self):
        """Load and prepare the dataset"""
        print("Loading dataset...")
        df = pd.read_csv(self.data_path)
        
        # Separate features and target
        self.feature_columns = [col for col in df.columns if col not in ['url', 'label']]
        X = df[self.feature_columns]
        y = df['label']
        
        print(f"Dataset shape: {df.shape}")
        print(f"Features: {len(self.feature_columns)}")
        print(f"Class distribution:\n{y.value_counts()}")
        
        return X, y
    
    def train_models(self, X, y):
        """Train multiple models"""
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        print("\nScaling features...")
        self.scaler = RobustScaler()  # More robust to outliers
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Define models with hyperparameters
        models = {
            'Random Forest': RandomForestClassifier(
                n_estimators=200,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            ),
            'Gradient Boosting': GradientBoostingClassifier(
                n_estimators=150,
                max_depth=10,
                learning_rate=0.1,
                random_state=42
            ),
            'Neural Network': MLPClassifier(
                hidden_layer_sizes=(256, 128, 64),
                activation='relu',
                solver='adam',
                max_iter=1000,
                random_state=42,
                early_stopping=True
            ),
            'SVM': SVC(
                kernel='rbf',
                C=10,
                gamma='scale',
                probability=True,
                random_state=42
            )
        }
        
        # Train and evaluate each model
        results = {}
        for name, model in models.items():
            print(f"\nTraining {name}...")
            
            # Train the model
            model.fit(X_train_scaled, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test_scaled)
            y_pred_proba = model.predict_proba(X_test_scaled)[:, 1] if hasattr(model, 'predict_proba') else None
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred)
            recall = recall_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred)
            
            # Cross-validation score
            cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
            
            results[name] = {
                'model': model,
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std()
            }
            
            print(f"Accuracy: {accuracy:.4f}")
            print(f"Precision: {precision:.4f}")
            print(f"Recall: {recall:.4f}")
            print(f"F1-Score: {f1:.4f}")
            print(f"CV Score: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
            
            self.models[name] = model
        
        return results, X_test_scaled, y_test
    
    def create_ensemble_model(self, X_train, y_train, X_test, y_test):
        """Create and train an ensemble model"""
        print("\nCreating ensemble model...")
        
        # Create individual models for ensemble
        rf = RandomForestClassifier(n_estimators=200, max_depth=20, random_state=42)
        gb = GradientBoostingClassifier(n_estimators=150, max_depth=10, random_state=42)
        nn = MLPClassifier(hidden_layer_sizes=(256, 128, 64), max_iter=1000, random_state=42)
        
        # Create voting classifier
        ensemble = VotingClassifier(
            estimators=[
                ('rf', rf),
                ('gb', gb),
                ('nn', nn)
            ],
            voting='soft',  # Use probability scores for voting
            weights=[2, 2, 1]  # Weight the models based on individual performance
        )
        
        # Train ensemble
        ensemble.fit(X_train, y_train)
        
        # Evaluate ensemble
        y_pred = ensemble.predict(X_test)
        y_pred_proba = ensemble.predict_proba(X_test)[:, 1]
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        
        print(f"Ensemble Model Performance:")
        print(f"Accuracy: {accuracy:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall: {recall:.4f}")
        print(f"F1-Score: {f1:.4f}")
        
        return ensemble, {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1
        }
    
    def feature_importance_analysis(self, model, feature_names):
        """Analyze feature importance"""
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            indices = np.argsort(importances)[::-1]
            
            print("\nTop 10 Most Important Features:")
            for i in range(10):
                print(f"{i+1}. {feature_names[indices[i]]}: {importances[indices[i]]:.4f}")
            
            return importances, indices
    
    def save_models(self):
        """Save trained models and scaler"""
        os.makedirs('models', exist_ok=True)
        
        # Save the best model (ensemble)
        if self.best_model:
            joblib.dump(self.best_model, 'models/phishing_model.pkl')
            print("Model saved to models/phishing_model.pkl")
        
        # Save scaler
        if self.scaler:
            joblib.dump(self.scaler, 'models/scaler.pkl')
            print("Scaler saved to models/scaler.pkl")
        
        # Save feature columns
        if self.feature_columns is not None:
            joblib.dump(self.feature_columns, 'models/feature_columns.pkl')
            print("Feature columns saved to models/feature_columns.pkl")
    
    def train(self):
        """Main training pipeline"""
        # Load data
        X, y = self.load_and_prepare_data()
        
        # Train individual models
        results, X_test, y_test = self.train_models(X, y)
        
        # Create ensemble
        ensemble, ensemble_results = self.create_ensemble_model(
            self.scaler.transform(X), y, X_test, y_test
        )
        
        # Set best model as ensemble
        self.best_model = ensemble
        
        # Feature importance analysis (using Random Forest from ensemble)
        rf_model = ensemble.named_estimators_['rf']
        self.feature_importance_analysis(rf_model, self.feature_columns)
        
        # Save models
        self.save_models()
        
        return results, ensemble_results

def main():
    # Create models directory
    import os
    os.makedirs('models', exist_ok=True)
    
    # Train models
    trainer = PhishingModelTrainer()
    individual_results, ensemble_results = trainer.train()
    
    print("\n" + "="*50)
    print("TRAINING COMPLETE")
    print("="*50)
    
    print("\nIndividual Model Performance Summary:")
    for name, metrics in individual_results.items():
        print(f"\n{name}:")
        print(f"  Accuracy: {metrics['accuracy']:.4f}")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall: {metrics['recall']:.4f}")
        print(f"  F1-Score: {metrics['f1_score']:.4f}")
    
    print("\n" + "="*50)
    print("Ensemble Model Performance:")
    print(f"Accuracy: {ensemble_results['accuracy']:.4f}")
    print(f"Precision: {ensemble_results['precision']:.4f}")
    print(f"Recall: {ensemble_results['recall']:.4f}")
    print(f"F1-Score: {ensemble_results['f1_score']:.4f}")
    print("="*50)

if __name__ == "__main__":
    main()