//Capitulo.cpp
#include "Capitulo.h"

Capitulo::Capitulo() {
    //cout<<"AND ANOTHER ONE"<<endl;
}
Capitulo::Capitulo(string id, string titulo, string duracion, string genero, string serie, string numero) : Video(id, titulo, duracion, genero), serie(serie), numero(numero) {
    // cout << "Inicializo yuju x 3" << endl;
}
void Capitulo::mostrar() const {
    cout << id << " - " << titulo << " - " << duracion << " - " << genero << " - " << serie << " - " << numero << " - ";
    double promedio = obtenerPromedio();
    if (promedio == -1.0) { // Como comente en video.cpp chatGPT me dio la idea de que me retorne -1 para evaluar el vector vacio
        cout << "SC" << endl;
    }
    else {
        cout << promedio << endl;
    }
}

string Capitulo::getTipo() const {
    return "Capitulo";
}

string Capitulo::getGenero() const {
    return genero;
}

