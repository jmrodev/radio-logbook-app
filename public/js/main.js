let appConfig = {}; // Global variable to store configuration

document.addEventListener('DOMContentLoaded', async function() {
    // Load configuration on page load
    try {
        const response = await fetch('/api/config');
        const responseText = await response.text();
        console.log('Raw response from /api/config:', responseText);

        if (!response.ok) {
            throw new Error(`Failed to load config: ${responseText}`);
        }

        // Check if responseText is valid JSON before parsing
        if (!responseText || (responseText.trim() !== '' && !/^[{\[\]].*[}\]]$/s.test(responseText.trim()))) {
            throw new Error(`Invalid JSON response from /api/config: ${responseText}`);
        }

        appConfig = JSON.parse(responseText);
        console.log('App configuration loaded:', appConfig);

        // Set current UTC date and time based on configured timezone
        const today = new Date();
        let utcDate;
        let utcTime;

        if (appConfig.timezone && appConfig.timezone !== 'UTC') {
            // Attempt to get UTC date and time for a specific timezone
            try {
                const dateOptions = { timeZone: appConfig.timezone, year: 'numeric', month: '2-digit', day: '2-digit' };
                const timeOptions = { timeZone: appConfig.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };

                const timeString = new Intl.DateTimeFormat('en-GB', timeOptions).format(today);
                utcTime = timeString; // HH:MM format

                const dateString = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(today);
                utcDate = dateString;

            } catch (e) {
                console.warn(`Invalid timezone configured: ${appConfig.timezone}. Falling back to system UTC.`, e);
                const utcNow = new Date(today.getTime() + today.getTimezoneOffset() * 60000);
                utcDate = utcNow.toISOString().split('T')[0];
                utcTime = utcNow.toISOString().substring(11, 16); // HH:MM format
            }
        } else {
            // Default to system UTC
            const utcNow = new Date(today.getTime() + today.getTimezoneOffset() * 60000);
            utcDate = utcNow.toISOString().split('T')[0];
            utcTime = utcNow.toISOString().substring(11, 16); // HH:MM format
        }
        document.getElementById('fecha').value = utcDate;
        document.getElementById('hora').value = utcTime;
        console.log(`Setting fecha to: ${utcDate}`);
        console.log(`Setting hora to: ${utcTime}`);

        // Load last used QSO parameters from config
        document.getElementById('banda').value = appConfig.lastBanda || '';
        document.getElementById('modo').value = appConfig.lastModo || '';
        document.getElementById('rst').value = appConfig.lastRst || '599';
        document.getElementById('prop').value = appConfig.lastProp || '';
        document.getElementById('x_qslMSG').value = appConfig.lastX_qslMSG || '';

        // Load checkbox states
        document.getElementById('submitToLda').checked = appConfig.submitToLda !== false; // default to true
        document.getElementById('submitToQrz').checked = appConfig.submitToQrz !== false; // default to true
        document.getElementById('submitToEqsl').checked = appConfig.submitToEqsl !== false; // default to true
        document.getElementById('saveToLocal').checked = appConfig.saveToLocal !== false; // default to true

        fetchDxSpots();
        setInterval(fetchDxSpots, 60000);

    } catch (error) {
        console.error('Error loading app configuration:', error);
    }
});

async function fetchDxSpots() {
    try {
        const response = await fetch('https://www.iz3mez.it/dx-cluster/last_100_json.php');
        const spots = await response.json();
        renderDxSpots(spots);
    } catch (error) {
        console.error('Error fetching DX spots:', error);
        document.getElementById('dx-spots').innerHTML = '<p>Error loading DX spots.</p>';
    }
}

function renderDxSpots(spots) {
    const spotsContainer = document.getElementById('dx-spots');
    spotsContainer.innerHTML = '';
    spots.forEach(spot => {
        const spotElement = document.createElement('p');
        spotElement.textContent = `${spot.dx_call} ${spot.freq} ${spot.de_call} ${spot.comment}`;
        spotsContainer.appendChild(spotElement);
    });
}
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000); // Hide after 3 seconds
}

document.getElementById('qsoForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.micall = appConfig.myCallsign; // Use myCallsign from loaded config
    data.user = appConfig.ldaUser; // Use ldaUser from loaded config
    data.pass = appConfig.ldaPass; // Use ldaPass from loaded config

    // Add checkbox states
    data.submitToLda = document.getElementById('submitToLda').checked;
    data.submitToQrz = document.getElementById('submitToQrz').checked;
    data.submitToEqsl = document.getElementById('submitToEqsl').checked;
    data.saveToLocal = document.getElementById('saveToLocal').checked;

    // Save current QSO parameters to appConfig for persistence
    appConfig.lastBanda = data.banda;
    appConfig.lastModo = data.modo;
    appConfig.lastRst = data.rst;
    appConfig.lastProp = data.prop;
    appConfig.lastX_qslMSG = data.x_qslMSG;
    appConfig.submitToLda = data.submitToLda;
    appConfig.submitToQrz = data.submitToQrz;
    appConfig.submitToEqsl = data.submitToEqsl;
    appConfig.saveToLocal = data.saveToLocal;

    // Save updated appConfig to backend
    await fetch('/api/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(appConfig)
    });

    // Format date and time for LdA API
    const [year, month, day] = data.fecha.split('-');
    data.fecha = `${day}/${month}/${year}`;
    data.hora = data.hora.replace(':', '');

    console.log('Data object before sending to server:', data);
    console.log('data.user:', data.user);
    console.log('data.pass:', data.pass);

    showToast('Submitting...', 'info');

    try {
        const response = await fetch('/api/qso', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showToast(`Success: ${result.message}`, 'success');
        } else {
            showToast(`Error: ${result.error || result.message}`, 'error');
        }
    } catch (error) {
        showToast(`Network error: ${error.message}`, 'error');
    }

    setTimeout(() => {
        document.getElementById('sucall').value = '';
        document.getElementById('sucallQrzResult').innerHTML = '';
        document.getElementById('sucall').focus();
    }, 100);
});

let lookupPerformed = false; // State variable to track if lookup has been performed
const sucallInput = document.getElementById('sucall');

sucallInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission on Enter
        const saveAnywayBtn = document.getElementById('saveAnywayBtn');
        if (saveAnywayBtn) {
            saveAnywayBtn.click();
        } else if (!lookupPerformed) {
            document.getElementById('lookupSucallBtn').click();
        } else {
            document.getElementById('qsoForm').submit();
        }
    } else if (event.key === 'Escape') {
        event.preventDefault();
        const cancelBtn = document.getElementById('cancelLookupBtn');
        if (cancelBtn) {
            cancelBtn.click();
        }
    }
});



document.getElementById('lookupSucallBtn').addEventListener('click', async function() {
    const sucall = document.getElementById('sucall').value;
    const qrzUsername = appConfig.qrzUsername; // Use qrzUsername from loaded config
    const qrzPassword = appConfig.qrzPassword; // Use qrzPassword from loaded config
    const sucallQrzResultDiv = document.getElementById('sucallQrzResult');
    sucallQrzResultDiv.className = 'result';
    sucallQrzResultDiv.textContent = 'Looking up correspondent callsign...';

    if (!sucall) {
        sucallQrzResultDiv.classList.add('error');
        sucallQrzResultDiv.textContent = 'Please enter a correspondent callsign (sucall) to lookup.';
        return;
    }

    if (!qrzUsername || !qrzPassword) {
        sucallQrzResultDiv.classList.add('error');
        sucallQrzResultDiv.textContent = 'Please enter your QRZ username and password in the Configuration Page.';
        return;
    }

    try {
        const response = await fetch(`/api/qrz-lookup?callsign=${sucall}&qrzUsername=${qrzUsername}&qrzPassword=${qrzPassword}`);
        const resultText = await response.text();
        console.log('QRZ Lookup Raw ResultText from API:', resultText);

        if (response.ok) {
            const qrzData = JSON.parse(resultText);
            // Assuming the structure is QRZDatabase.Callsign[0] as returned by the server
            // and that the server already returns the content of Callsign[0]
            const callsignData = qrzData;

            // Extract fields, handling potential undefined values and array wrappers
            const call = callsignData.call && callsignData.call[0] ? callsignData.call[0] : '';
            const fname = callsignData.fname && callsignData.fname[0] ? callsignData.fname[0] : '';
            const name = callsignData.name && callsignData.name[0] ? callsignData.name[0] : '';
            const addr2 = callsignData.addr2 && callsignData.addr2[0] ? callsignData.addr2[0] : '';
            const country = callsignData.country && callsignData.country[0] ? callsignData.country[0] : '';

            const formattedResult = `${call},${fname},${name},${addr2},${country}`;

            sucallQrzResultDiv.classList.add('success');
            sucallQrzResultDiv.textContent = `QRZ Lookup Successful for ${sucall}:\n${formattedResult}`;
            lookupPerformed = true;
        } else {
            sucallQrzResultDiv.classList.add('error');
            sucallQrzResultDiv.textContent = `Error looking up ${sucall}: ${resultText}`;
            lookupPerformed = false;

            // Remove existing buttons before adding new ones
            const existingSaveBtn = document.getElementById('saveAnywayBtn');
            if (existingSaveBtn) {
                existingSaveBtn.remove();
            }
            const existingCancelBtn = document.getElementById('cancelLookupBtn');
            if (existingCancelBtn) {
                existingCancelBtn.remove();
            }

            // Add Save Anyway button
            const saveAnywayBtn = document.createElement('button');
            saveAnywayBtn.id = 'saveAnywayBtn';
            saveAnywayBtn.textContent = 'Save Anyway';
            saveAnywayBtn.style.marginTop = '10px';
            saveAnywayBtn.style.backgroundColor = '#ffc107'; // Warning color
            saveAnywayBtn.style.color = '#212529';
            saveAnywayBtn.style.width = 'auto';
            saveAnywayBtn.style.padding = '8px 15px';
            saveAnywayBtn.style.fontSize = '0.9em';
            saveAnywayBtn.style.marginRight = '10px'; // Add some space
            saveAnywayBtn.addEventListener('click', () => {
                document.getElementById('qsoForm').dispatchEvent(new Event('submit', { cancelable: true }));
            });
            sucallQrzResultDiv.parentNode.insertBefore(saveAnywayBtn, sucallQrzResultDiv.nextSibling);

            // Add Cancel button
            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'cancelLookupBtn';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.style.marginTop = '10px';
            cancelBtn.style.backgroundColor = '#dc3545'; // Danger color
            cancelBtn.style.color = 'white';
            cancelBtn.style.width = 'auto';
            cancelBtn.style.padding = '8px 15px';
            cancelBtn.style.fontSize = '0.9em';
            cancelBtn.addEventListener('click', () => {
                sucallInput.value = ''; // Clear the sucall input
                lookupPerformed = false; // Reset lookup state
                sucallQrzResultDiv.textContent = ''; // Clear QRZ result text
                sucallQrzResultDiv.className = 'result'; // Reset styling
                saveAnywayBtn.remove(); // Remove Save Anyway button
                cancelBtn.remove(); // Remove Cancel button
            });
            sucallQrzResultDiv.parentNode.insertBefore(cancelBtn, sucallQrzResultDiv.nextSibling);
        }
    } catch (error) {
        console.error('Client-side error during QRZ lookup:', error);
        sucallQrzResultDiv.classList.add('error');
        sucallQrzResultDiv.textContent = `Network error during lookup: ${error.message}`;
    }
});
