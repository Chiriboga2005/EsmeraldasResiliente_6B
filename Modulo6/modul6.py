"""
Módulo 6 - IA y Análisis Predictivo | Esmeraldas Resiliente 2026
Python + Scikit-learn + FastAPI.
AVISO: resultados experimentales; NO son pronósticos ni alertas oficiales.
Los datos de ejemplo son SINTÉTICOS: reemplazar cargar_datos() por una consulta a PostgreSQL/PostGIS.
"""
import numpy as np
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.cluster import DBSCAN
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import classification_report

AVISO = "Resultado experimental. No sustituye pronósticos ni alertas oficiales (INAMHI / SNGR)."
RNG = np.random.default_rng(42)

# sector: (lat, lon, vulnerabilidad base 0-1)  -- coordenadas aproximadas
SECTORES = {
    "Las Palmas": (0.9880, -79.6700, 0.55), "Luis Tello": (0.9560, -79.6560, 0.80),
    "Codesa": (0.9400, -79.6700, 0.65), "Tachina": (0.9100, -79.6300, 0.50),
    "Propicia": (0.9490, -79.6450, 0.75), "Vista al Mar": (0.9650, -79.6900, 0.40),
    "Rio Teaone": (0.9300, -79.7100, 0.85), "Camarones": (0.9700, -79.6200, 0.70),
}
TIPOS = ["inundacion", "deslizamiento", "via_interrumpida", "desbordamiento"]


# ---------- 1. Datos ----------
def cargar_datos(n=1500) -> pd.DataFrame:
    """Histórico sintético 2019-2026 (con estacionalidad lluviosa ene-may)."""
    nombres = list(SECTORES)
    sec = RNG.choice(nombres, n, p=np.array([SECTORES[s][2] for s in nombres]) / sum(SECTORES[s][2] for s in nombres))
    dias = pd.date_range("2019-01-01", "2026-10-31")
    w = np.where(dias.month.isin([1, 2, 3, 4, 5]), 4.0, 1.0)
    fechas = pd.DatetimeIndex(RNG.choice(dias, n, p=w / w.sum()))
    mes = fechas.month.values
    lluvia_base = np.where(np.isin(mes, [1, 2, 3, 4, 5]), 60, 15)
    lluvia = np.clip(RNG.gamma(2.0, lluvia_base / 2), 0, 250)           # mm en 24 h
    nivel_rio = np.clip(lluvia / 60 + RNG.normal(0, .4, n), 0, 5)       # m sobre cota normal
    vuln = np.array([SECTORES[s][2] for s in sec])
    p_inund = 1 / (1 + np.exp(-(0.03 * lluvia + 0.6 * nivel_rio + 2.5 * vuln - 4.5)))
    tipo = np.where(RNG.random(n) < p_inund, "inundacion", RNG.choice(TIPOS[1:], n))
    atrapados = RNG.poisson(vuln * lluvia / 60)
    afectados = RNG.poisson(3 + vuln * lluvia / 8) + atrapados * 3
    score = 0.02 * lluvia + 0.5 * nivel_rio + 0.08 * afectados + 1.5 * (atrapados > 0) + 1.2 * vuln
    gravedad = pd.cut(score + RNG.normal(0, .3, n), [-9, 2.5, 4.5, 7, 99], labels=["baja", "media", "alta", "critica"])
    df = pd.DataFrame(dict(fecha=fechas, sector=sec, tipo=tipo, lluvia_24h=lluvia.round(1),
                           nivel_rio=nivel_rio.round(2), atrapados=atrapados, afectados=afectados,
                           gravedad=gravedad.astype(str)))
    df["lat"] = [SECTORES[s][0] + RNG.normal(0, .006) for s in sec]
    df["lon"] = [SECTORES[s][1] + RNG.normal(0, .006) for s in sec]
    df["mes"], df["hora"] = df.fecha.dt.month, RNG.integers(0, 24, n)
    return df.sort_values("fecha").reset_index(drop=True)


DF = cargar_datos()


# ---------- 2. Recurrencia de inundaciones por sector ----------
def recurrencia(df=DF) -> pd.DataFrame:
    inu = df[df.tipo.isin(["inundacion", "desbordamiento"])]
    r = inu.groupby("sector").agg(eventos=("fecha", "count"), anios_afectados=("fecha", lambda s: s.dt.year.nunique()),
                                  afectados_total=("afectados", "sum")).reset_index()
    r["eventos_por_anio"] = (r.eventos / (df.fecha.dt.year.nunique())).round(1)
    r["indice_recurrencia"] = (100 * r.eventos / r.eventos.max()).round(0)
    r["nivel"] = pd.cut(r.indice_recurrencia, [-1, 40, 70, 101], labels=["bajo", "medio", "alto"]).astype(str)
    return r.sort_values("indice_recurrencia", ascending=False)


# ---------- 3. Tendencias ----------
def tendencias(df=DF) -> dict:
    m = df.set_index("fecha").resample("MS").size()
    y = m.values.astype(float)
    t = np.arange(len(y)).reshape(-1, 1)
    pendiente = LinearRegression().fit(t, y).coef_[0]
    por_mes = df.groupby("mes").size().reindex(range(1, 13), fill_value=0)
    return dict(pendiente_incidentes_por_mes=round(float(pendiente), 3),
                tendencia="creciente" if pendiente > .02 else "decreciente" if pendiente < -.02 else "estable",
                meses_pico=por_mes.nlargest(3).index.tolist(),
                por_mes=por_mes.to_dict(), por_anio=df.groupby(df.fecha.dt.year).size().to_dict())


# ---------- 4. Patrones geográficos y temporales (DBSCAN) ----------
def patrones_geograficos(df=DF, eps_km=0.8, min_pts=25) -> list[dict]:
    X = np.radians(df[["lat", "lon"]].values)
    lab = DBSCAN(eps=eps_km / 6371, min_samples=min_pts, metric="haversine").fit_predict(X)
    d = df.assign(cluster=lab)
    d = d[d.cluster >= 0]
    return [dict(cluster=int(c), incidentes=len(g), lat=round(g.lat.mean(), 5), lon=round(g.lon.mean(), 5),
                 sector_dominante=g.sector.mode()[0], tipo_dominante=g.tipo.mode()[0],
                 hora_pico=int(g.hora.mode()[0]), mes_pico=int(g.mes.mode()[0]))
            for c, g in d.groupby("cluster")]


# ---------- 5. Clasificación y priorización de incidentes (Random Forest) ----------
_rec = recurrencia().set_index("sector").indice_recurrencia
FEATS = ["lluvia_24h", "nivel_rio", "atrapados", "afectados", "recurrencia"] + [f"tipo_{t}" for t in TIPOS]


def _X(df):
    X = df[["lluvia_24h", "nivel_rio", "atrapados", "afectados"]].copy()
    X["recurrencia"] = df.sector.map(_rec).fillna(0) if "sector" in df else df["recurrencia"]
    for t in TIPOS:
        X[f"tipo_{t}"] = (df.tipo == t).astype(int)
    return X[FEATS]


Xtr, Xte, ytr, yte = train_test_split(_X(DF), DF.gravedad, test_size=.25, stratify=DF.gravedad, random_state=1)
CLF = RandomForestClassifier(300, class_weight="balanced", random_state=1).fit(Xtr, ytr)
METRICAS = dict(accuracy_test=round(float(CLF.score(Xte, yte)), 3),
                cv5_accuracy=round(float(cross_val_score(RandomForestClassifier(150, random_state=1), _X(DF), DF.gravedad, cv=5).mean()), 3),
                importancias={k: float(v) for k, v in sorted(zip(FEATS, CLF.feature_importances_.round(3)), key=lambda x: -x[1])[:5]})
ORDEN = {"critica": 4, "alta": 3, "media": 2, "baja": 1}


def priorizar(incidentes: list[dict]) -> list[dict]:
    d = pd.DataFrame(incidentes)
    pr = CLF.predict_proba(_X(d))
    cls = list(CLF.classes_)
    d["gravedad_estimada"] = CLF.predict(_X(d))
    d["prioridad_score"] = sum(pr[:, i] * ORDEN[c] for i, c in enumerate(cls)).round(2)
    return d.sort_values("prioridad_score", ascending=False).to_dict("records")


# ---------- 6. Escenarios de riesgo (Gradient Boosting) ----------
_inu = DF.assign(inund=DF.tipo.isin(["inundacion", "desbordamiento"]).astype(int), vuln=DF.sector.map(lambda s: SECTORES[s][2]))
RISK = GradientBoostingClassifier(random_state=1).fit(_inu[["lluvia_24h", "nivel_rio", "vuln"]], _inu.inund)


def escenario(lluvia_24h: float, nivel_rio: float | None = None) -> list[dict]:
    nivel = lluvia_24h / 60 if nivel_rio is None else nivel_rio
    X = pd.DataFrame([[lluvia_24h, nivel, v[2]] for v in SECTORES.values()], columns=["lluvia_24h", "nivel_rio", "vuln"])
    p = RISK.predict_proba(X)[:, 1]
    out = [dict(sector=s, lat=v[0], lon=v[1], probabilidad_inundacion=round(float(pi), 3),
                nivel="alto" if pi >= .66 else "medio" if pi >= .33 else "bajo")
           for (s, v), pi in zip(SECTORES.items(), p)]
    return sorted(out, key=lambda x: -x["probabilidad_inundacion"])


# ---------- API REST ----------
app = FastAPI(title="Esmeraldas Resiliente - Módulo 6 IA")


class Incidente(BaseModel):
    sector: str
    tipo: str
    lluvia_24h: float = 0
    nivel_rio: float = 0
    atrapados: int = 0
    afectados: int = 0


def _r(x):
    return dict(aviso=AVISO, datos=x)


@app.get("/ia/recurrencia")
def api_rec(): return _r(recurrencia().to_dict("records"))
@app.get("/ia/tendencias")
def api_tend(): return _r(tendencias())
@app.get("/ia/patrones")
def api_pat(): return _r(patrones_geograficos())
@app.get("/ia/modelo")
def api_modelo(): return _r(METRICAS)
@app.get("/ia/escenario")
def api_esc(lluvia_24h: float, nivel_rio: float | None = None): return _r(escenario(lluvia_24h, nivel_rio))
@app.post("/ia/priorizar")
def api_prio(incs: list[Incidente]): return _r(priorizar([i.model_dump() for i in incs]))


if __name__ == "__main__":
    import json
    print(AVISO, "\n--- Recurrencia\n", recurrencia().to_string(index=False))
    print("--- Tendencias\n", {k: v for k, v in tendencias().items() if k not in ("por_mes", "por_anio")})
    print("--- Patrones\n", json.dumps(patrones_geograficos()[:3], indent=1))
    print("--- Modelo\n", METRICAS)
    print(classification_report(yte, CLF.predict(Xte)))
    print("--- Escenario 120 mm\n", escenario(120)[:3])
    print("--- Priorizar\n", pd.DataFrame(priorizar([
        dict(sector="Rio Teaone", tipo="desbordamiento", lluvia_24h=140, nivel_rio=3.1, atrapados=4, afectados=40),
        dict(sector="Vista al Mar", tipo="via_interrumpida", lluvia_24h=60, nivel_rio=.5, atrapados=0, afectados=3)])).to_string())