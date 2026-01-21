//Pelicula.cpp
#include "Pelicula.h"


Pelicula::Pelicula() {
    //cout<<"ANOTHER ONE"<<endl;
}

Pelicula::Pelicula(string id, string titulo, string duracion, string genero) : Video(id, titulo, duracion, genero) {
    // cout << "Inicializo yuju x2" << endl;
}

void Pelicula::mostrar() const { //Plotea
    cout << id << " - " << titulo << " - " << duracion << " - " << genero << " - ";
    double promedio = obtenerPromedio();
    if (promedio == -1.0) {  // Como comente en video.cpp chatGPT me dio la idea de que me retorne -1 para evaluar si el vector esta vacio entonces que muestre "Sc"
        cout << "SC" << endl;
    }
    else {
        cout << promedio << endl;
    }
}

string Pelicula::getTipo() const {
    return "Pelicula";
}

string Pelicula::getGenero() const {
    return genero;
}
