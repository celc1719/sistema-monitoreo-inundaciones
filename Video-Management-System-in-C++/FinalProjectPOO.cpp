//Main
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include "Video.h"
#include "Pelicula.h"
#include "Capitulo.h"
#include "Funciones.h"

using namespace std;

// OOPUtils
vector<string> split(const string& source, const string& delimiter) {
    vector<string> result;
    int start = 0;
    int end = source.find(delimiter);
    while (end != string::npos) {
        result.push_back(source.substr(start, end - start));
        start = end + delimiter.length();
        end = source.find(delimiter, start);
    }
    result.push_back(source.substr(start));
    return result;
}
// MAIN
int main() {
    //Lee el archivo y guarda
    ifstream archivo("videos.txt");
    string linea;
    vector<Video*> videos;

    while (getline(archivo, linea)) {
        vector<string> partes = split(linea, ",");

        if (partes[0] == "p") {//        ID       NOMBRE   DURACION   GENERO
            Video* p = new Pelicula(partes[1], partes[2], partes[3], partes[4]);
            videos.push_back(p);
        }
        else if (partes[0] == "c") {//   ID    TITULO    DURACION  GENERO     SERIE   NUMERO  VA A SER UN VECTOR QUE GUARDE LA CALIFICACION Y DIVIDA ENTRE EL SIZE DEL VECTOR Y SI NO TIENE NADA QUE PRINTE SC
            Video* c = new Capitulo(partes[1], partes[2], partes[3], partes[4], partes[5], partes[6]);
            videos.push_back(c);
        }
    }

    string opcionDelUsuario;
    string opcionDelUsuario2;
    string opcionDelUsuario3;



    // MENU
    while (opcionDelUsuario != "9") {

        cout << "----------------- MENU ---------------- " << endl;
        cout << "1. Mostrar todo el catalogo con calificaciones" << endl;
        cout << "2. Calificar un video" << endl;
        cout << "3. Mostrar peliculas o capitulos con una calificacion minima determinada" << endl;
        cout << "4. Mostrar peliculas o capitulos de un cierto genero" << endl;
        cout << "9. Salir" << endl;


        cin >> opcionDelUsuario;

        //----------- Mostrar catalogo -----------------
        if (opcionDelUsuario == "1") {
            cout << "Aqui el catalogo con calificaciones" << endl;
            for (Video* v : videos) { // For que recorre todo el vector
                cout << *v << endl; //SOBRECARGA DE OPERADORES BABY
                //v->mostrar();
                cout << "------------------------------" << endl;
            }

            continue;
        }

        //----------- Califaciones -------------------------
        else if (opcionDelUsuario == "2") {
            cout << "Escribe el ID del video que quieres calificar: ";
            string idBuscado;
            cin >> idBuscado;
            // Que pasa si no lo encuentra? ChatGPT me recomendo hacer esto para mostrar error si no encontro nada
            bool encontrado = false;
            for (Video* v : videos) { // For que recorre todo el vector
                if (v->getId() == idBuscado) {
                    cout << "YUPI! Video encontrado:" << endl; //era de prueba pero me gusto y lo deje
                    v->mostrar();
                    cout << "Ingresa la calificacion entre 0 y 5 no mas no menos: ";
                    double cal;
                    cin >> cal;
                    if (cal > 0.0 && cal <= 5.0) {
                        v->agregarCalificacion(cal);
                        cout << "Calificacion agregada correctamente" << endl;
                    }
                    else {
                        cout << "Calificacion invalida. Debe estar entre 0 y 5" << endl;
                    }
                    encontrado = true; // Lo encontro
                    break;
                }
            }
            // No lo encpntro :c
            if (!encontrado) {
                cout << "No se encontro ningun video con ese ID :c" << endl;
            }

            continue;
        }


        //------- Mostrar Videos miserables -----------------
        else if (opcionDelUsuario == "3") {
            // Calificacion minima primero
            double calMin;
            cout << "Ingresa la calificacion minima de 0 a 5: ";
            cin >> calMin;

            // Validamos la calificacion
            if (calMin < 0.0 || calMin > 5.0) {
                cout << "ERROR: aprende a leer pequenio usuario" << endl;
                continue;
            }

            cout << "Te lo muestro sin albur pero elige el que" << endl;
            cout << "------------------------------------------" << endl;
            cout << "a. Peliculas" << endl;
            cout << "b. Capitulos" << endl;
            cout << "c. Ambos" << endl;

            cin >> opcionDelUsuario2;
            // PELIS
            if (opcionDelUsuario2 == "a") {
                cout << "Mostrando peliculas con calificacion mayor o igual a " << calMin << " : " << endl;
                Funciones::mostrarPeliculas(videos, calMin);
            }
            // CAPS
            else if (opcionDelUsuario2 == "b") {
                cout << "Mostrando capitulos con calificacion mayor o igual a " << calMin << " : " << endl;
                Funciones::mostrarCapitulos(videos, calMin);
            }
            // AMBAS
            else if (opcionDelUsuario2 == "c") {
                cout << "Mostrando ambos con calificacion mayor o igual a " << calMin << " : " << endl;
                Funciones::mostrarAmbos(videos, calMin);
            }
            else {
                cout << "ERROR: Opcion invalida." << endl;
            }

            continue;
        }


        //--------------- Videos por genero -----------------
        else if (opcionDelUsuario == "4") {
            // Primero que quiere
            cout << "Que quiere papa de genero? " << endl;
            string gen;
            cin >> gen;
            // Asi es evaluamos todo esto porque no me quiero complicar :)
            if (gen != "Western" && gen != "Guerra" && gen != "Comedia" && gen != "Accion" && gen != "Animacion" && gen != "Fantasia" && gen != "Drama" && gen != "Ciencia Ficcion" && gen != "Biografia" && gen != "Aventura") {
                cout << "ERROR: no contamos con eso en nuestro sistema OxxoSmart lo siento " << endl;
                continue;
            }


            cout << "A continuacion se muestran las peliculas o capitulos en base al genero que decida, pero primero que quiere ver?" << endl;
            cout << "------------------------------------------" << endl;
            cout << "a. Peliculas" << endl;
            cout << "b. Capitulos" << endl;
            cout << "c. Ambos" << endl;

            cin >> opcionDelUsuario3;
            // PELIS
            if (opcionDelUsuario3 == "a") {
                cout << " A continuacion te muestro todas las Pelis del genero " << gen << endl;
                Funciones::mostrarPeliculasPorGenero(videos, gen);
            }
            // CAPIS
            else if (opcionDelUsuario3 == "b") {
                cout << " A continuacion te muestro todas los capitulos " << gen << endl;
                Funciones::mostrarCapitulosPorGenero(videos, gen);
            }
            // AMBAS
            else if (opcionDelUsuario3 == "c") {
                cout << " A continuacion te muestro ambos, pero escribe el genero che" << gen << endl;
                Funciones::mostrarAmbosPorGenero(videos, gen);
            }
            else {
                cout << "ERROR: Estoy cansado jefe" << endl;
            }
            continue;
        }
        // Se acaba todo 
        else if (opcionDelUsuario == "9") {
            cout << "Se acabo gracias por todo si aprendi :)" << endl;
            // HYGINE
            for (Video* v : videos) {
                delete v;
            }
            archivo.close();
            break;
        }
        else {
            cout << "ERROR -- Vuelva a intentar" << endl;

        }
    }



    return 0;
}