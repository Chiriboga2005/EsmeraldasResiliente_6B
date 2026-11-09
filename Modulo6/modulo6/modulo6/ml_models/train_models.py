"""
Entrenamiento y Validación Científica de Modelos de Inteligencia Artificial
Módulo 6: Inteligencia Artificial y Análisis Predictivo
Hackathon Esmeraldas Resiliente 2026
"""

import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score

def entrenar_modelo():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "historico_inundaciones_esmeraldas.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"No se encontró el dataset en {data_path}")

    df = pd.read_csv(data_path)
    print(f"Dataset cargado con éxito: {len(df)} registros")

    # Selección de variables predictoras (Features)
    feature_cols = [
        "lluvia_acumulada_24h_mm",
        "nivel_rio_m",
        "humedad_suelo_pct",
        "pendiente_terreno_grados",
        "distancia_cauce_m",
        "vulnerabilidad_base",
        "personas_atrapadas",
        "familias_afectadas",
        "viviendas_colapsadas"
    ]

    X = df[feature_cols].copy()
    y_raw = df["prioridad_triage"].copy()

    # Codificación de etiquetas
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    clases = list(le.classes_)

    # Escalado de características
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # División estratificada Train / Test (80% / 20%)
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.20, random_state=42, stratify=y
    )

    # Modelo Principal: Random Forest con regularización para evitar overfitting
    rf = RandomForestClassifier(
        n_estimators=120,
        max_depth=9,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        class_weight="balanced"
    )

    rf.fit(X_train, y_train)

    # Predicciones
    y_pred_train = rf.predict(X_train)
    y_pred_test = rf.predict(X_test)

    # Validación Cruzada K-Fold (5 particiones)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(rf, X_scaled, y, cv=cv, scoring="accuracy")

    acc_train = accuracy_score(y_train, y_pred_train)
    acc_test = accuracy_score(y_test, y_pred_test)
    f1_weighted = f1_score(y_test, y_pred_test, average="weighted")

    # Importancia de características
    importancias = {
        col: round(float(imp), 4)
        for col, imp in zip(feature_cols, rf.feature_importances_)
    }
    # Ordenar por mayor importancia
    importancias = dict(sorted(importancias.items(), key=lambda item: item[1], reverse=True))

    # Matriz de confusión y reporte
    labels_idx = list(range(len(clases)))
    cm = confusion_matrix(y_test, y_pred_test, labels=labels_idx).tolist()

    # Reporte de clasificación
    clf_report = classification_report(
        y_test, y_pred_test, labels=labels_idx, target_names=clases, output_dict=True, zero_division=0
    )

    metricas = {
        "algoritmo": "Random Forest Classifier (Ensemble Multi-árbol)",
        "framework": "Scikit-learn 1.9.1 & Python 3.13",
        "justificacion_tecnica": (
            "Se seleccionó Random Forest debido a su robustez frente al sobreajuste, "
            "capacidad para capturar relaciones no lineales complejas entre variables climáticas "
            "(precipitación torrencial y niveles de río) e impacto humano, "
            "así como su explicabilidad mediante métricas de importancia de características (Feature Importance)."
        ),
        "total_muestras": len(df),
        "muestras_entrenamiento": len(X_train),
        "muestras_prueba": len(X_test),
        "exactitud_entrenamiento_pct": round(float(acc_train) * 100, 2),
        "exactitud_prueba_pct": round(float(acc_test) * 100, 2),
        "validacion_cruzada_5f_media_pct": round(float(cv_scores.mean()) * 100, 2),
        "validacion_cruzada_5f_std_pct": round(float(cv_scores.std()) * 100, 2),
        "f1_score_ponderado_pct": round(float(f1_weighted) * 100, 2),
        "importancia_caracteristicas": importancias,
        "clases": clases,
        "matriz_confusion": cm,
        "reporte_clasificacion": {
            cls: {
                "precision": round(clf_report[cls]["precision"], 3),
                "recall": round(clf_report[cls]["recall"], 3),
                "f1_score": round(clf_report[cls]["f1-score"], 3),
                "support": clf_report[cls]["support"]
            }
            for cls in clases
        },
        "aviso_rigor_cientifico": (
            "Rigor Científico: Los modelos son analíticos y de carácter experimental para apoyo "
            "a la priorización de recursos del COE Cantonal y Bomberos. "
            "No sustituyen las alertas ni pronósticos meteorológicos oficiales emitidos por el INAMHI "
            "o la Secretaría Nacional de Gestión de Riesgos y Emergencias (SNGRE)."
        )
    }

    # Guardar artefactos
    models_dir = os.path.dirname(__file__)
    joblib.dump(rf, os.path.join(models_dir, "modelo_priorizacion_incidentes.joblib"))
    joblib.dump(scaler, os.path.join(models_dir, "scaler_features.joblib"))
    joblib.dump(le, os.path.join(models_dir, "encoder_labels.joblib"))

    with open(os.path.join(models_dir, "metricas_modelo.json"), "w", encoding="utf-8") as f:
        json.dump(metricas, f, indent=2, ensure_ascii=False)

    print("\n" + "="*60)
    print("RESUMEN CIENTÍFICO DEL MODELO DE INTELIGENCIA ARTIFICIAL")
    print("="*60)
    print(f"Algoritmo: {metricas['algoritmo']}")
    print(f"Exactitud en Prueba (Test Accuracy): {metricas['exactitud_prueba_pct']}%")
    print(f"Validación Cruzada (5-Fold CV): {metricas['validacion_cruzada_5f_media_pct']}% ± {metricas['validacion_cruzada_5f_std_pct']}%")
    print(f"F1-Score Ponderado: {metricas['f1_score_ponderado_pct']}%")
    print("\nTop Variables Más Influyentes:")
    for col, imp in list(importancias.items())[:5]:
        print(f" - {col:28s}: {imp*100:5.2f}%")
    print("="*60)
    print(f"Artefactos guardados exitosamente en: {models_dir}")

if __name__ == "__main__":
    entrenar_modelo()
