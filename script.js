const CONFIG = {
    owner: 'TWÓJ_LOGIN_GITHUB',          // np. 'jan-kowalski'
    repo: 'NAZWA_REPOZYTORIUM',         // np. 'moja-strona'
    path: 'data.json',                  // ścieżka do pliku danych
    token: 'TWÓJ_TOKEN_GITHUB',         // UWAGA: W produkcji NIE umieszczaj tu tokenu!
    branch: 'main',                     // gałąź repozytorium
    syncInterval: 30000                 // synchronizacja co 30 sekund
};

async function getFileSHA() {
    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) throw new Error('Nie można pobrać SHA pliku');
    
    const data = await response.json();
    return data.sha;
}

async function fetchData() {
    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}?ref=${CONFIG.branch}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${CONFIG.token}`,
            'Accept': 'application/vnd.github.v3.raw'
        }
    });
    
    if (!response.ok) throw new Error('Błąd pobierania danych');
    
    const jsonData = await response.json();
    return jsonData;
}

async function saveData(newData) {
    const sha = await getFileSHA();
    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`;
    
    // Konwersja danych do base64
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2)));
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${CONFIG.token}`,
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
            message: 'Aktualizacja danych',
            content: content,
            sha: sha,
            branch: CONFIG.branch
        })
    });
    
    if (!response.ok) throw new Error('Błąd zapisu danych');
    
    return await response.json();
}

async function synchronizeData() {
    try {
        // Pobierz dane z GitHub
        const remoteData = await fetchData();
        
        // Pobierz lokalne dane
        const localData = JSON.parse(localStorage.getItem('personList') || '[]');
        
        // Scal zmiany (prosta implementacja - w praktyce potrzebny bardziej zaawansowany algorytm)
        const mergedData = [...remoteData, ...localData.filter(item => 
            !remoteData.some(rItem => rItem.id === item.id)
        ];
        
        // Zapisz scalone dane
        await saveData(mergedData);
        
        // Zaktualizuj localStorage
        localStorage.setItem('personList', JSON.stringify(mergedData));
        
        // Wyświetl potwierdzenie
        updateSyncStatus(`Zsynchronizowano: ${new Date().toLocaleTimeString()}`);
        
        return mergedData;
    } catch (error) {
        console.error('Błąd synchronizacji:', error);
        updateSyncStatus(`Błąd: ${error.message}`);
        return JSON.parse(localStorage.getItem('personList') || '[]');
    }
}

// Renderuj listę osób
function renderPersonList(persons) {
    const container = document.getElementById('person-list');
    container.innerHTML = '';
    
    persons.forEach(person => {
        const div = document.createElement('div');
        div.className = 'person';
        div.innerHTML = `<strong>${person.name}</strong>, wiek: ${person.age}`;
        container.appendChild(div);
    });
}

// Aktualizuj status synchronizacji
function updateSyncStatus(message) {
    document.getElementById('sync-status').textContent = message;
}

// Inicjalizacja
async function init() {
    // Pierwsze ładowanie danych
    let data = [];
    
    try {
        data = await synchronizeData();
    } catch {
        data = JSON.parse(localStorage.getItem('person-list') || '[]');
    }
    
    renderPersonList(data);
    
    // Ustaw okresową synchronizację
    setInterval(async () => {
        data = await synchronizeData();
        renderPersonList(data);
    }, CONFIG.syncInterval);
    
    // Nasłuchuj przycisku dodawania
    document.getElementById('add-btn').addEventListener('click', async () => {
        const name = document.getElementById('name').value;
        const age = document.getElementById('age').value;
        
        if (!name || !age) return;
        
        // Dodaj osobę do lokalnych danych
        const localData = JSON.parse(localStorage.getItem('person-list') || '[]');
        const newPerson = {
            id: Date.now(), // unikalne ID
            name,
            age: parseInt(age),
            timestamp: new Date().toISOString()
        };
        
        localData.push(newPerson);
        localStorage.setItem('person-list', JSON.stringify(localData));
        
        // Odśwież widok
        renderPersonList(localData);
        
        // Wyczyść formularz
        document.getElementById('name').value = '';
        document.getElementById('age').value = '';
        
        // Oznacz do synchronizacji
        updateSyncStatus('Zmiany lokalne - oczekiwanie na synchronizację...');
    });
}

// Start aplikacji
document.addEventListener('DOMContentLoaded', init);

// Zamiast bezpośredniego wywołania GitHub API
async function fetchData() {
    const response = await fetch('/api/get-data');
    return await response.json();
}

app.get('/api/get-data', async (req, res) => {
    const githubResponse = await fetch('https://api.github.com/...', {
        headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
    });
    res.json(await githubResponse.json());
});

// Plik /api/sync.js
exports.handler = async (event) => {
    // Logika bezpiecznego połączenia z GitHub
};

async function handleConflicts(localData, remoteData) {
    // Znajdź elementy zmodyfikowane lokalnie i zdalnie
    const localChanges = localData.filter(lItem => 
        !remoteData.some(rItem => rItem.id === lItem.id) || 
        remoteData.some(rItem => 
            rItem.id === lItem.id && 
            new Date(rItem.timestamp) < new Date(lItem.timestamp)
    );
    
    // Połącz zmiany (strategia: lokalne zmiany mają priorytet)
    const mergedData = [
        ...remoteData.filter(rItem => 
            !localChanges.some(lItem => lItem.id === rItem.id)
        ),
        ...localChanges
    ];
    
    return mergedData;
}

// W schemacie danych
{
    id: 123,
    name: "Jan",
    age: 30,
    version: 3, // zwiększaj przy każdej modyfikacji
    lastModified: "2023-10-01T12:30:00Z"
}

// Przed wysłaniem na serwer
if (!navigator.onLine) {
    const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    queue.push({ type: 'ADD_PERSON', data: newPerson });
    localStorage.setItem('syncQueue', JSON.stringify(queue));
    return;
}
