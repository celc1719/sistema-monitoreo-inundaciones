//Video.h
#pragma once
#include <iostream>
#include <string>
#include <vector>

using namespace std;

class Video {
protected: // Encapsulacion
    string id;
    string titulo;
    string duracion;
    string genero;
    vector<double> calificaciones = {};


public:
    Video(); //pred
    Video(string id, string titulo, string duracion, string genero); //cons
    virtual void mostrar() const = 0; // Herencia
    void agregarCalificacion(double calificacion); //Agrega calificacion al vector
    double obtenerPromedio() const; // Dolor de cabeza
    string getId() const; //getters
    virtual string getTipo() const = 0; // Herencia
    virtual string getTitulo() const; // Herencia
    virtual ~Video(); //Destructor
    virtual string getGenero() const = 0;// Herencia
    string getDuracion() const; //GETTERS
    

};
//overload de operator y afera de la funcion porque adentro da error
ostream& operator<<(ostream& os, const Video& v);

