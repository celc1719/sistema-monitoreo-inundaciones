#include <iostream>
using namespace std;

int queenInRow[8];        // queenInRow[row] = column where the queen is placed in that row
bool col[8];              // col[c] = true if column c is already occupied
bool diag1[15];           // diag1[row + col]  (main diagonal ↘)
bool diag2[15];           // diag2[row - col + 7] (anti-diagonal ↙)
int soluciones = 0;

// ----------------- COMMON UTILITIES -----------------

void imprimirTablero() {
    for (int f = 0; f < 8; f++) {
        for (int c = 0; c < 8; c++) {
            if (queenInRow[f] == c) cout << "Q ";
            else cout << ". ";
        }
        cout << '\n';
    }
    cout << "-------------------------\n";
}

// Checks whether placing a queen at (row, c) conflicts with any queen already stored in queenInRow
bool esValidaPosicion(int fila, int c) {
    for (int f = 0; f < 8; f++) {
        int qc = queenInRow[f];
        if (qc == -1) continue; // no queen in this row yet

        // same column
        if (qc == c) return false;

        // same diagonal: absolute row difference equals absolute column difference
        if (abs(fila - f) == abs(c - qc)) return false;
    }
    return true;
}

// ----------------- AUTOMATIC SOLVER MODE -----------------

void imprimirSolucion() {
    imprimirTablero();
}

void solve(int fila) {
    if (fila == 8) {
        soluciones++;
        imprimirSolucion();
        return;
    }

    for (int c = 0; c < 8; c++) {
        if (!col[c] && !diag1[fila + c] && !diag2[fila - c + 7]) {
            // Place queen
            queenInRow[fila] = c;
            col[c] = true;
            diag1[fila + c] = true;
            diag2[fila - c + 7] = true;

            // Recurse to the next row
            solve(fila + 1);

            // Backtrack
            col[c] = false;
            diag1[fila + c] = false;
            diag2[fila - c + 7] = false;
        }
    }
}

// ----------------- USER GAME MODE -----------------

void juegoConUsuario() {
    // Initialize board with no queens
    for (int i = 0; i < 8; i++) {
        queenInRow[i] = -1;
    }

    cout << "You will place 8 queens on an 8x8 board.\n";
    cout << "Enter row and column between 1 and 8.\n";
    cout << "The program checks that queens do not attack each other.\n\n";

    int colocadas = 0;
    while (colocadas < 8) {
        int f, c;
        cout << "Queen #" << (colocadas + 1) << " - row and column (1-8 1-8): ";
        cin >> f >> c;

        // Validate input range
        if (f < 1 || f > 8 || c < 1 || c > 8) {
            cout << "Out of range. Must be between 1 and 8.\n";
            continue;
        }

        // Convert to 0-based indices
        f--;
        c--;

        // If there's already a queen in that row, disallow it (matches the queenInRow[row] representation)
        if (queenInRow[f] != -1) {
            cout << "There is already a queen in row " << (f + 1) << ". Choose a different row.\n";
            continue;
        }

        // Validate against existing queens
        if (!esValidaPosicion(f, c)) {
            cout << "That queen attacks one of the queens you've already placed. Try another position.\n";
            continue;
        }

        // Accept the position
        queenInRow[f] = c;
        colocadas++;

        cout << "Current board:\n";
        imprimirTablero();
    }

    // Final verification (should be valid if checks worked)
    bool ok = true;
    for (int f = 0; f < 8 && ok; f++) {
        for (int g = f + 1; g < 8; g++) {
            int c1 = queenInRow[f];
            int c2 = queenInRow[g];
            if (c1 == c2) ok = false;
            if (abs(f - g) == abs(c1 - c2)) ok = false;
        }
    }

    if (ok) {
        cout << "Congrats, you built a VALID 8-queens configuration.\n";
    } else {
        cout << "The final configuration is NOT valid (some queens attack each other).\n";
    }
}

// ----------------- MAIN -----------------

int main() {
    // Initialize solver structures
    for (int i = 0; i < 8; i++) {
        col[i] = false;
        queenInRow[i] = -1;
    }
    for (int i = 0; i < 15; i++) {
        diag1[i] = false;
        diag2[i] = false;
    }

    int opcion;
    cout << "8 queens problem\n";
    cout << "1) Automatically solve and print all solutions\n";
    cout << "2) Play: you place queens and the program validates\n";
    cout << "Choose an option (1 or 2): ";
    cin >> opcion;

    if (opcion == 1) {
        solve(0);
        cout << "Total solutions: " << soluciones << endl;
    } else if (opcion == 2) {
        juegoConUsuario();
    } else {
        cout << "Invalid option.\n";
    }

    return 0;
}
