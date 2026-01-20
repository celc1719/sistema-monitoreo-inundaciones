import pandas as pd
from sklearn.linear_model import LinearRegression
import pickle
from database import get_database

def entrenar_modelo_distancia():
    db = get_database()

    # Leer datos desde MongoDB
    datos = list(db.Sensor.find())

    if len(datos) < 10:
        print("No hay datos suficientes para entrenar el modelo.")
        return

    # Crear DataFrame con tus campos reales
    df = pd.DataFrame(datos)

    # Convertir fecha a datetime
    df["fecha"] = pd.to_datetime(df["fecha"])
    df = df.sort_values("fecha")

    # Renombrar campos a nombres simples si quieres (opcional)
    df = df.rename(columns={
        "distancia_cm": "distancia",
        "humedad": "humedad",
        "temperatura": "temperatura"
    })

    # Calcular cambio de distancia (velocidad aprox)
    df["cambio_distancia"] = df["distancia"].diff().fillna(0)

    # Crear TARGET = distancia futura (siguiente registro)
    df["distancia_futura"] = df["distancia"].shift(-1)

    # Quitar la última fila que no tiene futura
    df = df.dropna()

    # Variables de entrada (features)
    X = df[["distancia", "temperatura", "humedad", "cambio_distancia"]]

    # Variable objetivo
    y = df["distancia_futura"]

    # Entrenar modelo
    modelo = LinearRegression()
    modelo.fit(X, y)

    # Guardar modelo
    with open("modelo_distancia.pkl", "wb") as f:
        pickle.dump(modelo, f)

    print(" Modelo ENTRENADO y guardado como modelo_distancia.pkl")

if __name__ == "__main__":
    entrenar_modelo_distancia()
