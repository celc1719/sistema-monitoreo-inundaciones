//Pelicula.h
#pragma once
#include <iostream>
#include <string>
#include <vector>
#include "Video.h"
using namespace std;

class Pelicula : public Video {
public:
    Pelicula();
    Pelicula(string id, string titulo, string duracion, string genero);
    void mostrar() const override; //Heredado de vidos
    string getTipo() const override;
    string getGenero() const override;

};



