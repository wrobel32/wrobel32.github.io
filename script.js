// =============================================
// EKSPORT I IMPORT DANYCH (SYNCHRONIZACJA)
// =============================================

// Dodajemy przyciski w menu
const navMenu = document.querySelector('nav');
navMenu.innerHTML += `
    <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
        <h2>Synchronizacja</h2>
        <a href="#" class="nav-link" data-page="export-import">Eksport/Import</a>
    </div>
`;

// Dodajemy stronę do eksportu/importu
const main = document.querySelector('main');
main.innerHTML += `
    <!-- Strona: Eksport/Import -->
    <div id="export-import" class="page">
        <h2>Eksport i import danych</h2>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 300px; background: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h3>Eksport danych</h3>
                <p>Eksportuj wszystkie dane do pliku JSON. Możesz go zapisać i zaimportować na innym urządzeniu.</p>
                <button id="export-data" style="margin-top: 15px;">Eksportuj dane</button>
                <div id="export-result" style="margin-top: 15px; word-break: break-all;"></div>
            </div>
            
            <div style="flex: 1; min-width: 300px; background: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h3>Import danych</h3>
                <p>Zaimportuj dane z pliku JSON (zastąpią one obecne dane w przeglądarce).</p>
                <input type="file" id="import-file" accept=".json" style="margin: 15px 0;">
                <button id="import-data">Importuj dane</button>
                <div id="import-result" style="margin-top: 15px;"></div>
            </div>
        </div>
    </div>
`;

// Funkcja eksportu danych
document.getElementById('export-data')?.addEventListener('click', () => {
    const dataToExport = {
        lists: JSON.parse(localStorage.getItem('attendanceLists')) || [],
        globalPeople: JSON.parse(localStorage.getItem('globalPeople')) || [],
        personDetails: JSON.parse(localStorage.getItem('personDetails')) || {},
        functions: JSON.parse(localStorage.getItem('globalFunctions')) || [],
        version: 1.0,
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const exportResult = document.getElementById('export-result');
    
    // Tworzenie pliku do pobrania
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Pokazanie danych na ekranie
    exportResult.innerHTML = `
        <p style="color: green;">Dane wyeksportowane pomyślnie!</p>
        <details style="margin-top: 10px;">
            <summary>Pokaż dane</summary>
            <pre style="background: white; padding: 10px; border-radius: 5px; max-height: 200px; overflow: auto;">${dataStr}</pre>
        </details>
    `;
});

// Funkcja importu danych
document.getElementById('import-data')?.addEventListener('click', () => {
    const fileInput = document.getElementById('import-file');
    const importResult = document.getElementById('import-result');
    
    if (!fileInput.files.length) {
        importResult.innerHTML = '<p style="color: red;">Wybierz plik do importu!</p>';
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Walidacja danych
            if (!importedData.lists || !importedData.globalPeople || !importedData.personDetails || !importedData.functions) {
                throw new Error('Nieprawidłowy format pliku');
            }
            
            if (!confirm('Czy na pewno chcesz zaimportować dane? Wszystkie bieżące dane zostaną nadpisane.')) {
                importResult.innerHTML = '<p style="color: orange;">Import anulowany</p>';
                return;
            }
            
            // Zapis danych
            localStorage.setItem('attendanceLists', JSON.stringify(importedData.lists));
            localStorage.setItem('globalPeople', JSON.stringify(importedData.globalPeople));
            localStorage.setItem('personDetails', JSON.stringify(importedData.personDetails));
            localStorage.setItem('globalFunctions', JSON.stringify(importedData.functions));
            
            // Aktualizacja stanu aplikacji
            attendanceData = {
                lists: importedData.lists,
                globalPeople: importedData.globalPeople,
                personDetails: importedData.personDetails,
                functions: importedData.functions
            };
            
            // Odświeżenie UI
            renderLists();
            renderGlobalPeople();
            renderFunctions();
            renderListFilterOptions();
            renderListPeopleOptions();
            renderPeopleDetails();
            
            importResult.innerHTML = `
                <p style="color: green;">Dane zaimportowane pomyślnie!</p>
                <p>Zaimportowano:
                    <br>• Listy: ${importedData.lists.length}
                    <br>• Osoby: ${importedData.globalPeople.length}
                    <br>• Funkcje: ${importedData.functions.length}
                </p>
            `;
            
            // Automatyczne przejście do list
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            document.getElementById('lists').classList.add('active');
            
        } catch (error) {
            console.error('Błąd importu:', error);
            importResult.innerHTML = `<p style="color: red;">Błąd importu: ${error.message}</p>`;
        }
    };
    
    reader.readAsText(file);
});

// Dodajemy obsługę nowej strony w nawigacji
function setupNavigation() {
    // ... istniejący kod ...
    
    // Dodajemy obsługę nowej strony
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            // ... istniejący kod ...
            
            if (pageId === 'export-import') {
                // Resetuj wyniki
                document.getElementById('export-result').innerHTML = '';
                document.getElementById('import-result').innerHTML = '';
            }
        });
    });
}

// =============================================
// AUTOMATYCZNA SYNCHRONIZACJA PRZEZ SERWER (OPCJONALNIE)
// =============================================

// Funkcja do automatycznej synchronizacji z serwerem (wymaga backendu)
async function syncWithServer() {
    try {
        // Pobierz ostatni timestamp synchronizacji
        const lastSync = localStorage.getItem('lastSync') || 0;
        
        // Wyślij dane do serwera
        const response = await fetch('https://twoj-serwer.pl/sync', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                data: attendanceData,
                lastSync
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Aktualizuj dane z serwera
            attendanceData = result.data;
            saveData();
            
            // Zapisz nowy timestamp
            localStorage.setItem('lastSync', Date.now());
            console.log('Synchronizacja z serwerem udana');
        }
    } catch (error) {
        console.error('Błąd synchronizacji z serwerem:', error);
    }
}

// Automatyczna synchronizacja co 5 minut
// setInterval(syncWithServer, 5 * 60 * 1000);
