import os

BASE_CORE_DIR = os.path.abspath(os.path.dirname(__file__))
AI_APP_DIR = os.path.abspath(os.path.join(BASE_CORE_DIR, ".."))

def get_data_path(filename):
    """
    Retorna la ruta absoluta de los datasets dentro de Backend/apps/ai_analytics/data/
    """
    path = os.path.join(AI_APP_DIR, "data", filename)
    if os.path.exists(path):
        return os.path.abspath(path)
    return os.path.abspath(path)

def get_model_path(filename=""):
    """
    Retorna la ruta absoluta de los modelos Scikit-Learn dentro de Backend/apps/ai_analytics/ml_models/
    """
    path = os.path.join(AI_APP_DIR, "ml_models", filename)
    if os.path.exists(path):
        return os.path.abspath(path)
    return os.path.abspath(path)

