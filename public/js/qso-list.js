// public/js/qso-list.js
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/qso/list');
        const qsos = await response.json();
        renderQsoTable(qsos);
    } catch (error) {
        console.error('Error fetching QSO list:', error);
        document.getElementById('qso-table').innerHTML = '<p>Error loading QSO list.</p>';
    }
});

function renderQsoTable(qsos) {
    const tableContainer = document.getElementById('qso-table');
    if (qsos.length === 0) {
        tableContainer.innerHTML = '<p>No QSOs found in local database.</p>';
        return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create table headers
    const headers = ['Timestamp', 'Callsign', 'Band', 'Mode', 'Date', 'Time', 'RST'];
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Create table rows
    qsos.forEach(qso => {
        const row = document.createElement('tr');
        const cells = [
            new Date(qso.timestamp).toLocaleString(),
            qso.sucall,
            qso.banda,
            qso.modo,
            qso.fecha,
            qso.hora,
            qso.rst
        ];
        cells.forEach(cellText => {
            const td = document.createElement('td');
            td.textContent = cellText;
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}