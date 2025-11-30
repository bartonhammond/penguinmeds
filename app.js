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
    document.getElementById('mj-date').value = getDateStr(now)
    document.getElementById('nic-date').value = getDateStr(now)
    document.getElementById('mj-time').value = timeStr;
    document.getElementById('nic-time').value = timeStr;
}

// Tab switching
function switchTab(index) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    setCurrentTime()
    
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
    return date.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
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
function getDayDifferenceIgnoreTime(date1, date2) {
  // Normalize both dates to midnight UTC
  const utcDate1 = new Date(Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate()));
  const utcDate2 = new Date(Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate()));

  // Calculate the difference in milliseconds
  const diffInMilliseconds = Math.abs(utcDate2.getTime() - utcDate1.getTime());

  // Convert milliseconds to days (1000ms * 60s * 60m * 24h)
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  
  // Return the number of full days
  return Math.floor(diffInMilliseconds / millisecondsPerDay);
}

// Clean old data
async function cleanOldData() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('entries:'));
    const now = new Date()
    keys.forEach(key => {
        const date = new Date(key.replace('entries:', ''))
	const daysBetween = getDayDifferenceIgnoreTime(now, date);

	if ((daysBetween) > 10) {
            localStorage.removeItem(key);
        }
    });
}

// Cancel edit mode
function cancelEdit(prefix) {
    App.editingEntry[prefix] = null;
    setCurrentTime();
    
    document.getElementById(`${prefix}-submit-btn`).textContent = 'Add Entry';
    document.getElementById(`${prefix}-cancel-btn`).style.display = 'none';
    document.getElementById(`${prefix}-edit-indicator`).style.display = 'none';
    
    updateUI(prefix);
}

// Edit entry
function editEntry(prefix, timestamp) {
    App.editingEntry[prefix] = timestamp;
    
    const today = document.getElementById(`${prefix}-date`).value
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
            
            updateUI(prefix);
        }
    }
}

// Delete entry
function deleteEntry(prefix, timestamp, event) {
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
        updateUI(prefix);
    }
}

// Add or update entry
function addEntry(prefix) {
    const date = document.getElementById(`${prefix}-date`).value
    const type = document.getElementById(`${prefix}-type`).value;
    const amount = parseInt(document.getElementById(`${prefix}-amount`).value);
    const time = document.getElementById(`${prefix}-time`).value;

    if (!type || !amount || !time || !date) {
        alert('Please fill in all fields');
        return;
    }

    const key = `entries:${date}`;
    
    let entries = [];
    const data = localStorage.getItem(key);
    if (data) {
        entries = JSON.parse(data);
    }
    
    if (App.editingEntry[prefix]) {
        const index = entries.findIndex(e => e.timestamp === App.editingEntry[prefix]);
        if (index !== -1) {
            entries[index] = {
                prefix,
                type,
                amount,
                time,
                timestamp: App.editingEntry[prefix]
            };
        }
        App.editingEntry[prefix] = null;
        
        document.getElementById(`${prefix}-submit-btn`).textContent = 'Add Entry';
        document.getElementById(`${prefix}-cancel-btn`).style.display = 'none';
        document.getElementById(`${prefix}-edit-indicator`).style.display = 'none';
    } else {
        const newEntry = {
            prefix,
            type,
            amount,
            time,
            timestamp: Date.now()
        };
        entries.push(newEntry);
    }
    
    localStorage.setItem(key, JSON.stringify(entries));
    updateUI(prefix);
    setCurrentTime();
    cleanOldData();
}

// Update UI
function updateUI(prefix) {
    const today = document.getElementById(`${prefix}-date`).value
    const key = `entries:${today}`;
    
    let entries = [];
    const data = localStorage.getItem(key);
    if (data) {
        entries = JSON.parse(data);
    }
    
    const filtered = entries.filter(e => e.prefix === prefix);
    const total = filtered.reduce((sum, e) => sum + e.amount, 0);
    
    document.getElementById(`${prefix}-total`).textContent = total;
    
    const recentDiv = document.getElementById(`${prefix}-recent`);
    if (filtered.length === 0) {
        recentDiv.innerHTML = '<div class="no-data">No entries date</div>';
    } else {
        recentDiv.innerHTML = '<h3 style="margin-top: 20px; margin-bottom: 10px; color: #00838F;">Entries</h3>' +
            filtered.sort((a, b) => b.timestamp - a.timestamp).map(e => `
                <div class="entry-item ${App.editingEntry[prefix] === e.timestamp ? 'editing' : ''}" data-medicine="${prefix}" data-timestamp="${e.timestamp}">
                    <div class="entry-info">
                        <div class="entry-type">${e.type}</div>
                        <div class="entry-time">${e.time}</div>
                    </div>
                    <div class="entry-amount">${e.amount} mg</div>
                    <button class="delete-btn" data-medicine="${prefix}" data-timestamp="${e.timestamp}">Delete</button>
                </div>
            `).join('');
    }
}

// Draw chart
function drawChart(prefix) {
    const canvas = document.getElementById(`${prefix}-chart`);
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
            const filtered = entries.filter(e => {
		if (prefix === 'mj')
		    e.medicine === 'marijuana'
		if (prefix === 'nic')
		    e.medicine === 'nicotine'
		
	    });
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
document.getElementById('mj-date').addEventListener('change', (e) => {
    updateUI('mj')
});					    
document.getElementById('nic-date').addEventListener('change', (e) => {
    updateUI('nic')
});					    
						   
    
document.getElementById('mj-submit-btn').addEventListener('click', () => addEntry('mj'));
document.getElementById('nic-submit-btn').addEventListener('click', () => addEntry('nic'));
document.getElementById('mj-cancel-btn').addEventListener('click', () => cancelEdit('mj'));
document.getElementById('nic-cancel-btn').addEventListener('click', () => cancelEdit('nic'));

// Initialize
setTimeout(() => {
    setCurrentTime();
    updateUI('mj');
    updateUI('nic');
    cleanOldData();
}, 100);
