#include "Funciones.h"

//FUNCIONES PARA OPCION 3
void Funciones::mostrarPeliculas(const vector<Video*>& videos, double calMin) {
    for (Video* v : videos) { // Recorre toda el vector facilito
        if (v->getTipo() == "Pelicula" && v->obtenerPromedio() >= calMin) { //Si es peli y su cal es mayor o igual ploteara
            cout << v->getId() << " - " << v->getTitulo() << " - ";
            double promedio = v->obtenerPromedio();
            if (promedio == -1.0) { // Como comente en video.cpp chatGPT me dio la idea de que me retorne -1 para evaluar si el vector esta vacio entonces que muestre "Sc"
                cout << "SC" << endl;
            }
            else {
                cout << promedio << endl;
            }
        }
    }
}
//Same comentarios pero con cap
void Funciones::mostrarCapitulos(const vector<Video*>& videos, double calMin) {
    for (Video* v : videos) {
        if (v->getTipo() == "Capitulo" && v->obtenerPromedio() >= calMin) {
            cout << v->getId() << " - " << v->getTitulo() << " - ";
            double promedio = v->obtenerPromedio();
            if (promedio == -1.0) {
                cout << "SC" << endl;
            }
            else {
                cout << promedio << endl;
            }
        }
    }
}
// Ambos
void Funciones::mostrarAmbos(const vector<Video*>& videos, double calMin) {
    for (Video* v : videos) {
        if (v->obtenerPromedio() >= calMin) {
            cout << v->getId() << " - " << v->getTitulo() << " - ";
            double promedio = v->obtenerPromedio();
            if (promedio == -1.0) {
                cout << "SC" << endl;
            }
            else {
                cout << promedio << endl;
            }
        }
    }
}

// OPCIONES PARA LA OPCION 4

void Funciones::mostrarPeliculasPorGenero(const std::vector<Video*>& videos, const std::string& genero) {
    for (Video* v : videos) {
        if (v->getTipo() == "Pelicula" && v->getGenero() == genero) {
            v->mostrar();
            std::cout << "------------------------------" << std::endl;
        }
    }
}

void Funciones::mostrarCapitulosPorGenero(const std::vector<Video*>& videos, const std::string& genero) {
    for (Video* v : videos) {
        if (v->getTipo() == "Capitulo" && v->getGenero() == genero) {
            v->mostrar();
            std::cout << "------------------------------" << std::endl;
        }
    }
}

void Funciones::mostrarAmbosPorGenero(const std::vector<Video*>& videos, const std::string& genero) {
    for (Video* v : videos) {
        if (v->getGenero() == genero) {
            v->mostrar();
            std::cout << "------------------------------" << std::endl;
        }
    }
}