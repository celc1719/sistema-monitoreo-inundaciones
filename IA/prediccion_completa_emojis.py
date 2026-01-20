import pandas as pd
import pickle
import matplotlib.pyplot as plt
from database import get_database

def prediccion_completa():

    #  1. Cargar modelo de distancia futura
    try:
        modelo_distancia = pickle.load(open("modelo_distancia.pkl", "rb"))
    except:
        print("❌ Error al cargar modelo_distancia.pkl")
        return

    #  2. Traer datos recientes de la base nueva
    db = get_database()

    #  Últimos 3 datos (para cálculos)
    datos_calculo = list(db.Sensor.find().sort("fecha", -1).limit(3))

    #  Últimos 50 datos (para gráficas)
    datos_grafica = list(db.Sensor.find().sort("fecha", -1).limit(50))

    if len(datos_calculo) < 2:
        print("⚠️ No hay suficientes datos en la base de datos.")
        return

    df = pd.DataFrame(datos_calculo).sort_values("fecha")
    df_graph = pd.DataFrame(datos_grafica).sort_values("fecha")

    # 🧾 Últimos datos
    ultimo = df.iloc[-1]
    penultimo = df.iloc[-2]

    distancia_actual = float(ultimo["distancia_cm"])
    humedad_actual = float(ultimo["humedad"])
    temperatura_actual = float(ultimo["temperatura"])

    # Cálculo del cambio de distancia
    cambio_dist = distancia_actual - float(penultimo["distancia_cm"])

    # 3. Predicción de distancia futura con el modelo
    X_pred = pd.DataFrame([{
        "distancia": distancia_actual,
        "temperatura": temperatura_actual,
        "humedad": humedad_actual,
        "cambio_distancia": cambio_dist
    }])

    distancia_futura = modelo_distancia.predict(X_pred)[0]

    # 4. Cálculo del riesgo
    riesgo = "🟢 Bajo"
    if distancia_futura < 2:
        riesgo = "🔴 Alto"
    elif distancia_futura < 3:
        riesgo = "🟡 Medio"

    # 🖨️ 5. Impresión solicitada
    print("================================")
    print("🔮 PREDICCIÓN COMPLETA")
    print("================================")

    print(f"🌊 Nivel actual del agua: {distancia_actual:.2f} cm")
    print(f"📉 Cambio del agua: {cambio_dist:.2f} cm")
    print("")
    print(f"💧 Humedad actual: {humedad_actual:.2f} %")
    print(f"🌡️ Temperatura actual: {temperatura_actual:.2f} °C")
    print("")
    print(f"📘 Distancia futura predicha: {distancia_futura:.2f} cm")
    print(f"🚨 Riesgo estimado: {riesgo}")
    print("================================")

    # ======================================
    # 📉 GRÁFICA 1 → Cambios de distancia
    # ======================================
    plt.figure(figsize=(10, 4))
    plt.plot(df_graph["fecha"], df_graph["distancia_cm"], linewidth=2)
    plt.title("Historial de Distancia del Agua")
    plt.xlabel("Fecha")
    plt.ylabel("Distancia (cm)")
    plt.grid(True)
    plt.tight_layout()
    plt.show()

    # ======================================
    #  GRÁFICA 2 → Humedad y Temperatura
    # ======================================
    plt.figure(figsize=(10, 4))
    plt.plot(df_graph["fecha"], df_graph["humedad"], linewidth=2, label="Humedad")
    plt.plot(df_graph["fecha"], df_graph["temperatura"], linewidth=2, label="Temperatura")
    plt.title("Historial de Humedad y Temperatura")
    plt.xlabel("Fecha")
    plt.ylabel("Valor")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()

    return {
        "distancia_futura": distancia_futura,
        "riesgo": riesgo
    }

if __name__ == "__main__":
    prediccion_completa()
