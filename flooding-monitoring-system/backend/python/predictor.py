import os
import pickle
import json
import sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import base64
from io import BytesIO

# ============================
# 1. Leer JSON desde Node.js
# ============================
raw = sys.stdin.read()
data = json.loads(raw)

distancia = data["distancia"]
temperatura = data["temperatura"]
humedad = data["humedad"]
cambio = data["cambio"]

# ============================
# 2. Cargar modelo (ruta robusta relativa al script)
# ============================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "model.pkl")
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

# ============================
# 3. Hacer predicción
# ============================
entrada = [[distancia, temperatura, humedad, cambio]]
pred = model.predict(entrada)[0]

# ============================
# 4. Crear gráfica
# ============================
plt.figure(figsize=(6,4))
plt.plot(["distancia", "temp", "humedad", "predicción"],
         [distancia, temperatura, humedad, pred])

plt.title("Predicción del Modelo")
plt.tight_layout()

buffer = BytesIO()
plt.savefig(buffer, format="png")
buffer.seek(0)

b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
plt.close()

# ============================
# 5. Imprimir JSON para Node
# ============================
print(json.dumps({
    "prediccion": float(pred),
    "grafica_base64": b64
}))
