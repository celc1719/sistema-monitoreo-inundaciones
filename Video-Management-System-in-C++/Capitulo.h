//Capitulo.h
#pragma once
#include <iostream>
#include <string>
#include <vector>
#include "Video.h"
using namespace std;

class Capitulo : public Video {
    string serie;
    string numero;


public:
    Capitulo();
    Capitulo(string id, string titulo, string duracion, string genero, string serie, string numero);
    void mostrar() const override;
    string getTipo() const override;
    string getGenero() const override;

};
