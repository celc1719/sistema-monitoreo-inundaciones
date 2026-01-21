//Video.cpp
#include "Video.h"
Video::Video() {
    //cout<<"PREDETERMINADO BABY"<<endl;
}
Video::Video(string id, string titulo, string duracion, string genero) : id(id), titulo(titulo), duracion(duracion), genero(genero) {
    // cout << "Inicializo yuju << endl;
}
Video::~Video() {
    // cout << "DESTRUYO... si.. creo...  << endl;
}
string Video::getId() const {
    return id;
}
void Video::agregarCalificacion(double calificacion) {
    calificaciones.push_back(calificacion);
}

double Video::obtenerPromedio() const {
    if (calificaciones.empty()) {
        return -1.0;  // Chatgpt me ayudo en esta parte porque si el vector esta vacio entonces retornara -1, y si mi pelicula.cpp/capitulo.cpp recibe ese -1 entonces imprime "SC"
    }
    double suma = 0.0;
    for (double c : calificaciones) {
        suma += c;
    }
    return suma / calificaciones.size();
}
string Video::getTitulo() const {
    { return titulo; }
}

string Video::getDuracion() const {
    return duracion;
}

ostream& operator<<(ostream& os, const Video& v) { //overload de operator
    os << v.getId() << " - " << v.getTitulo() << " - " << v.getDuracion() << " - " << v.getGenero() << " - ";
    double prom = v.obtenerPromedio();
    if (prom == -1)
        os << "SC"<<endl;
    else
        os << " - " << prom;

    return os;
}

