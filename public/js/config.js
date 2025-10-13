document.addEventListener('DOMContentLoaded', loadConfig);

async function loadConfig() {
    const configMessageDiv = document.getElementById('configMessage');
    configMessageDiv.className = 'message';
    configMessageDiv.textContent = 'Loading configuration...';

    try {
        const response = await fetch('/api/config');
        const config = await response.json();

        document.getElementById('qrzApiKey').value = config.qrzApiKey || '';
        document.getElementById('qrzHasSubscription').checked = config.qrzHasSubscription || false;
        document.getElementById('myCallsign').value = config.myCallsign || '';
        document.getElementById('ldaUser').value = config.ldaUser || '';
        document.getElementById('ldaPass').value = config.ldaPass || '';
        document.getElementById('qrzUsername').value = config.qrzUsername || '';
        document.getElementById('qrzPassword').value = config.qrzPassword || '';
        document.getElementById('timezone').value = config.timezone || 'UTC';
        document.getElementById('eqslUsername').value = config.eqslUsername || '';
        document.getElementById('eqslPassword').value = config.eqslPassword || '';

        configMessageDiv.classList.add('success');
        configMessageDiv.textContent = 'Configuration loaded.';
    } catch (error) {
        console.error('Error loading configuration:', error);
        configMessageDiv.classList.add('error');
        configMessageDiv.textContent = `Error loading configuration: ${error.message}`;
    }
}

document.getElementById('configForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const qrzApiKey = document.getElementById('qrzApiKey').value;
    const qrzHasSubscription = document.getElementById('qrzHasSubscription').checked;
    const myCallsign = document.getElementById('myCallsign').value;
    const ldaUser = document.getElementById('ldaUser').value;
    const ldaPass = document.getElementById('ldaPass').value;
    const qrzUsername = document.getElementById('qrzUsername').value;
    const qrzPassword = document.getElementById('qrzPassword').value;
    const timezone = document.getElementById('timezone').value;
    const eqslUsername = document.getElementById('eqslUsername').value;
    const eqslPassword = document.getElementById('eqslPassword').value;

    const configMessageDiv = document.getElementById('configMessage');
    configMessageDiv.className = 'message';
    configMessageDiv.textContent = 'Saving configuration...';

    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ qrzApiKey, qrzHasSubscription, myCallsign, ldaUser, ldaPass, qrzUsername, qrzPassword, timezone, eqslUsername, eqslPassword })
        });
        const result = await response.json();

        if (response.ok) {
            configMessageDiv.classList.add('success');
            configMessageDiv.textContent = result.message;
        } else {
            configMessageDiv.classList.add('error');
            configMessageDiv.textContent = `Error: ${result.error || result.message}`;
        }
    } catch (error) {
        console.error('Client-side error saving configuration:', error);
        configMessageDiv.classList.add('error');
        configMessageDiv.textContent = `Network error: ${error.message}`;
    }
});