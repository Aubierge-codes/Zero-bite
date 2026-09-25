"""Process-wide singletons so every router shares one model and one weather cache."""
from ml.predictor import RiskPredictor
from ml.risk_engine import RiskEngine

predictor = RiskPredictor()
engine    = RiskEngine(predictor)
