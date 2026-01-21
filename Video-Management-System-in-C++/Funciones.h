#pragma once

#include <vector>
#include <iostream>
#include "Video.h"

class Funciones {
public:
    // Aqui chatGPT me recomendo hacer funciones estaticas para llamarlas sin crear un objeto de la clase al fin y al cabo solo son funciones que puse aca para no saturar el main mas de lo que ya esta
    static void mostrarPeliculas(const vector<Video*>& videos, double calMin); // & esta pa que no haga copias del vector y siempre use el mismo
    static void mostrarCapitulos(const vector<Video*>& videos, double calMin);
    static void mostrarAmbos(const vector<Video*>& videos, double calMin);
    //Ahora para las de genero, pero es casi lo mismo 
    static void mostrarPeliculasPorGenero(const std::vector<Video*>& videos, const std::string& genero);
    static void mostrarCapitulosPorGenero(const std::vector<Video*>& videos, const std::string& genero);
    static void mostrarAmbosPorGenero(const std::vector<Video*>& videos, const std::string& genero);
};


