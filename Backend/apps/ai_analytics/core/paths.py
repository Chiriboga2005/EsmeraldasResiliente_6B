import os

BASE_CORE_DIR = os.path.abspath(os.path.dirname(__file__))

def get_data_path(filename):
    for candidate in [
        os.path.join(BASE_CORE_DIR, "..", "data", filename),
        os.path.join(BASE_CORE_DIR, "..", "..", "data", filename),
        os.path.join(BASE_CORE_DIR, "..", "..", "..", "Modulo6", "modulo6", "modulo6", "data", filename),
    ]:
        cand = os.path.abspath(candidate)
        if os.path.exists(cand):
            return cand
    return os.path.abspath(os.path.join(BASE_CORE_DIR, "..", "data", filename))

def get_model_path(filename=""):
    for candidate in [
        os.path.join(BASE_CORE_DIR, "..", "ml_models", filename),
        os.path.join(BASE_CORE_DIR, "..", "..", "ml_models", filename),
        os.path.join(BASE_CORE_DIR, "..", "..", "..", "Modulo6", "modulo6", "modulo6", "ml_models", filename),
    ]:
        cand = os.path.abspath(candidate)
        if os.path.exists(cand):
            return cand
    return os.path.abspath(os.path.join(BASE_CORE_DIR, "..", "ml_models", filename))

