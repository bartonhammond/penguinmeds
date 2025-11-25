// Global app state
const App = {
    editingEntry: {
        marijuana: null,
        nicotine: null
    }
};

// Set current time
function setCurrentTime() {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    document.getElementById('mj-time').value = timeStr;
    document.getElementById('nic-time').value = timeStr;
}

// Tab switching
function switchTab(index) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    contents.forEach((content, i) => {
        content.classList.toggle('active', i === index);
    });

    if (index === 2) drawChart('marijuana');
    if (index === 3) drawChart('nicotine');
}

// Get date string
function getDateStr(date = new Date()) {
    return date.toISOString().split('T')[0];
}

// Get last 7 days
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(getDateStr(d));
    }
    return days;
}

// Clean old data
async function cleanOldData() {
    const validDays = getLast7Days();
    const keys = Object.keys(localStorage).filter(key => key.startsWith('entries:'));
    
    keys.forEach(key => {
        const date = key.replace('entries:', '');
        if (!validDays.includes(date)) {
            localStorage.removeItem(key);
        }
    });
}

// Cancel edit mode
function cancelEdit(medicine) {
    App.editingEntry[medicine] = null;
    const prefix = medicine === 'marijuana' ? 'mj' : 'nic';
    
    document.getElementById(`${prefix}-type`).value = medicine === 'marijuana' ? 'flower' : 'gum';
    document.getElementById(`${prefix}-amount`).value = medicine === 'marijuana' ? '5' : '2';
    setCurrentTime();
    
    document.getElementById(`${prefix}-submit-btn`).textContent = 'Add Entry';
    document.getElementById(`${prefix}-cancel-btn`).style.display = 'none';
    document.getElementById(`${prefix}-edit-indicator`).style.display = 'none';
    
    updateUI(medicine);
}

// Edit entry
function editEntry(medicine, timestamp) {
    App.editingEntry[medicine] = timestamp;
    const prefix = medicine === 'marijuana' ? 'mj' : 'nic';
    
    const today = getDateStr();
    const key = `entries:${today}`;
    
    const data = localStorage.getItem(key);
    if (data) {
        const entries = JSON.parse(data);
        const entry = entries.find(e => e.timestamp === timestamp);
        
        if (entry) {
            document.getElementById(`${prefix}-type`).value = entry.type;
            document.getElementById(`${prefix}-amount`).value = entry.amount.toString();
            document.getElementById(`${prefix}-time`).value = entry.time;
            
            document.getElementById(`${prefix}-submit-btn`).textContent = 'Update Entry';
            document.getElementById(`${prefix}-cancel-btn`).style.display = 'block';
            document.getElementById(`${prefix}-edit-indicator`).style.display = 'block';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            updateUI(medicine);
        }
    }
}

// Delete entry
function deleteEntry(medicine, timestamp, event) {
    event.stopPropagation();
    
    if (!confirm('Delete this entry?')) {
        return;
    }
    
    const today = getDateStr();
    const key = `entries:${today}`;
    
    const data = localStorage.getItem(key);
    if (data) {
        let entries = JSON.parse(data);
        entries = entries.filter(e => e.timestamp !== timestamp);
        localStorage.setItem(key, JSON.stringify(entries));
        updateUI(medicine);
    }
}

// Add or update entry
function addEntry(medicine) {
    const prefix = medicine === 'marijuana' ? 'mj' : 'nic';
    const type = document.getElementById(`${prefix}-type`).value;
    const amount = parseInt(document.getElementById(`${prefix}-amount`).value);
    const time = document.getElementById(`${prefix}-time`).value;
    
    if (!type || !amount || !time) {
        alert('Please fill in all fields');
        return;
    }
    
    const today = getDateStr();
    const key = `entries:${today}`;
    
    let entries = [];
    const data = localStorage.getItem(key);
    if (data) {
        entries = JSON.parse(data);
    }
    
    if (App.editingEntry[medicine]) {
        const index = entries.findIndex(e => e.timestamp === App.editingEntry[medicine]);
        if (index !== -1) {
            entries[index] = {
                medicine,
                type,
                amount,
                time,
                timestamp: App.editingEntry[medicine]
            };
        }
        App.editingEntry[medicine] = null;
        
        document.getElementById(`${prefix}-submit-btn`).textContent = 'Add Entry';
        document.getElementById(`${prefix}-cancel-btn`).style.display = 'none';
        document.getElementById(`${prefix}-edit-indicator`).style.display = 'none';
    } else {
        const newEntry = {
            medicine,
            type,
            amount,
            time,
            timestamp: Date.now()
        };
        entries.push(newEntry);
    }
    
    localStorage.setItem(key, JSON.stringify(entries));
    updateUI(medicine);
    setCurrentTime();
    cleanOldData();
}

// Update UI
function updateUI(medicine) {
    const today = getDateStr();
    const key = `entries:${today}`;
    
    let entries = [];
    const data = localStorage.getItem(key);
    if (data) {
        entries = JSON.parse(data);
    }
    
    const filtered = entries.filter(e => e.medicine === medicine);
    const total = filtered.reduce((sum, e) => sum + e.amount, 0);
    
    const prefix = medicine === 'marijuana' ? 'mj' : 'nic';
    document.getElementById(`${prefix}-total`).textContent = total;
    
    const recentDiv = document.getElementById(`${prefix}-recent`);
    if (filtered.length === 0) {
        recentDiv.innerHTML = '<div class="no-data">No entries today</div>';
    } else {
        recentDiv.innerHTML = '<h3 style="margin-top: 20px; margin-bottom: 10px; color: #00838F;">Today\'s Entries</h3>' +
            filtered.sort((a, b) => b.timestamp - a.timestamp).map(e => `
                <div class="entry-item ${App.editingEntry[medicine] === e.timestamp ? 'editing' : ''}" data-medicine="${medicine}" data-timestamp="${e.timestamp}">
                    <div class="entry-info">
                        <div class="entry-type">${e.type}</div>
                        <div class="entry-time">${e.time}</div>
                    </div>
                    <div class="entry-amount">${e.amount} mg</div>
                    <button class="delete-btn" data-medicine="${medicine}" data-timestamp="${e.timestamp}">Delete</button>
                </div>
            `).join('');
    }
}

// Draw chart
function drawChart(medicine) {
    const canvas = document.getElementById(`${medicine === 'marijuana' ? 'mj' : 'nic'}-chart`);
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    
    const days = getLast7Days();
    const data = [];
    
    for (const day of days) {
        const key = `entries:${day}`;
        const stored = localStorage.getItem(key);
        let total = 0;
        
        if (stored) {
            const entries = JSON.parse(stored);
            const filtered = entries.filter(e => e.medicine === medicine);
            total = filtered.reduce((sum, e) => sum + e.amount, 0);
        }
        data.push(total);
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...data, 10);
    const stepX = chartWidth / (days.length -1 );
    
    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw grid lines
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }
    
    // Draw line
    ctx.strokeStyle = '#00CED1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((value, i) => {
        const x = padding + stepX * i;
        const y = canvas.height - padding - (value / maxValue) * chartHeight;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Draw points and labels
    ctx.fillStyle = '#00CED1';
    data.forEach((value, i) => {
        const x = padding + stepX * i;
        const y = canvas.height - padding - (value / maxValue) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#00838F';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(value + 'mg', x, y - 12);
    });
    
    // Draw day labels
    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    days.forEach((day, i) => {
	yearMonthDay = day.split('-')
	const x = padding + stepX * i;
	const label = new Date(yearMonthDay[0], yearMonthDay[1], yearMonthDay[2]).toLocaleDateString('en-US', { day: 'numeric' });
	ctx.fillText(label, x, canvas.height - padding + 20);
    });
}

// Event delegation for tabs
document.querySelector('.tabs').addEventListener('click', (e) => {
    if (e.target.classList.contains('tab')) {
        const index = parseInt(e.target.dataset.tab);
        switchTab(index);
    }
});

// Event delegation for entries
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const medicine = e.target.dataset.medicine;
        const timestamp = parseInt(e.target.dataset.timestamp);
        deleteEntry(medicine, timestamp, e);
    } else if (e.target.closest('.entry-item') && !e.target.classList.contains('delete-btn')) {
        const item = e.target.closest('.entry-item');
        const medicine = item.dataset.medicine;
        const timestamp = parseInt(item.dataset.timestamp);
        editEntry(medicine, timestamp);
    }
});

// Button event listeners
document.getElementById('mj-submit-btn').addEventListener('click', () => addEntry('marijuana'));
document.getElementById('nic-submit-btn').addEventListener('click', () => addEntry('nicotine'));
document.getElementById('mj-cancel-btn').addEventListener('click', () => cancelEdit('marijuana'));
document.getElementById('nic-cancel-btn').addEventListener('click', () => cancelEdit('nicotine'));

// Initialize
setTimeout(() => {
    setCurrentTime();
    updateUI('marijuana');
    updateUI('nicotine');
    cleanOldData();
}, 100);
