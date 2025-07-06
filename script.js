// Global variables
let guestData = {};
let tableData = {};
let currentGuest = null;
let autocompleteTimeout = null;
let selectedSuggestionIndex = -1;
let suggestions = [];

// Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyy1_UbVLMSPiWGbpXlrr-t5J3yZCTMAQH8ota7V1hSFwWEW1eU2-jUajEkUTrarrXv/exec';

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
});

// Load guest and table data
async function loadData() {
    try {
        // Load guest data
        const guestResponse = await fetch('./data/guests.json');
        guestData = await guestResponse.json();
        
        // Load table data
        const tableResponse = await fetch('./data/tables.json');
        tableData = await tableResponse.json();
        
        // Generate floor plan
        generateFloorPlan();
        
        console.log('Dữ liệu đã được tải thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        // Show error message to user
        showError('Không thể tải dữ liệu khách mời. Vui lòng làm mới trang và thử lại.');
    }
}

// Setup event listeners
function setupEventListeners() {
    const guestNameInput = document.getElementById('guestName');
    
    // Autocomplete functionality
    guestNameInput.addEventListener('input', function(e) {
        handleAutocompleteInput(e.target.value);
    });
    
    // Keyboard navigation for autocomplete
    guestNameInput.addEventListener('keydown', function(e) {
        handleAutocompleteKeydown(e);
    });
    
    // Enter key support for search
    guestNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedSuggestionIndex >= 0 && suggestions.length > 0) {
                selectSuggestion(selectedSuggestionIndex);
            } else {
                searchGuest();
            }
        }
    });
    
    // Hide autocomplete when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-input-container')) {
            hideAutocomplete();
        }
    });
    
    // Modal close on outside click
    window.addEventListener('click', function(e) {
        const errorModal = document.getElementById('errorModal');
        const successModal = document.getElementById('successModal');
        
        if (e.target === errorModal) {
            closeModal();
        }
        if (e.target === successModal) {
            closeSuccessModal();
        }
    });
}

// Search for guest
function searchGuest() {
    const guestName = document.getElementById('guestName').value.trim();
    
    if (!guestName) {
        alert('Vui lòng nhập tên để tìm kiếm.');
        return;
    }
    
    // Show loading state
    const searchBtn = document.getElementById('searchBtn');
    const originalText = searchBtn.textContent;
    searchBtn.innerHTML = '<span class="loading"></span> Đang tìm...';
    searchBtn.disabled = true;
    
    // Simulate search delay for better UX
    setTimeout(() => {
        const foundGuest = findGuest(guestName);
        
        // Reset button
        searchBtn.textContent = originalText;
        searchBtn.disabled = false;
        
        if (foundGuest) {
            currentGuest = foundGuest;
            showFloorPlan(foundGuest);
        } else {
            showErrorModal();
        }
    }, 500);
}

// Find guest in data (case-insensitive, partial matching)
function findGuest(searchName) {
    const normalizedSearch = searchName.toLowerCase().trim();
    
    // First try exact match
    for (const [guestName, guestInfo] of Object.entries(guestData)) {
        if (guestName.toLowerCase() === normalizedSearch) {
            return { 
                name: guestName, 
                id: guestInfo.id,
                table: guestInfo.table, 
                description: guestInfo.description 
            };
        }
    }
    
    // Then try partial match
    for (const [guestName, guestInfo] of Object.entries(guestData)) {
        if (guestName.toLowerCase().includes(normalizedSearch) || 
            normalizedSearch.includes(guestName.toLowerCase())) {
            return { 
                name: guestName, 
                id: guestInfo.id,
                table: guestInfo.table, 
                description: guestInfo.description 
            };
        }
    }
    
    // Try matching individual words
    const searchWords = normalizedSearch.split(' ');
    for (const [guestName, guestInfo] of Object.entries(guestData)) {
        const nameWords = guestName.toLowerCase().split(' ');
        const hasMatch = searchWords.some(searchWord => 
            nameWords.some(nameWord => 
                nameWord.includes(searchWord) || searchWord.includes(nameWord)
            )
        );
        if (hasMatch && searchWords.length > 0 && searchWords[0].length > 2) {
            return { 
                name: guestName, 
                id: guestInfo.id,
                table: guestInfo.table, 
                description: guestInfo.description 
            };
        }
    }
    
    return null;
}

// Show floor plan with highlighted table
function showFloorPlan(guest) {
    // Update guest info
    const guestInfo = document.getElementById('guestInfo');
    guestInfo.innerHTML = `
        <h3>${guest.name}</h3>
        <p>Quý khách ngồi tại <strong>Bàn ${guest.table}</strong></p>
    `;
    
    // Hide search section and show floor plan
    document.getElementById('searchSection').style.display = 'none';
    document.getElementById('floorPlanSection').style.display = 'block';
    
    // Highlight the guest's table
    highlightTable(guest.table);
    
    // Check if already checked in
    updateCheckInStatus(guest);
    
    // Scroll to floor plan
    document.getElementById('floorPlanSection').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Generate SVG floor plan
function generateFloorPlan() {
    const floorPlan = document.getElementById('floorPlan');
    floorPlan.innerHTML = ''; // Clear existing content
    
    // Add background elements
    addFloorPlanBackground(floorPlan);
    
    // Add tables
    tableData.tables.forEach(table => {
        addTableToFloorPlan(floorPlan, table);
    });
}

// Add background elements to floor plan
function addFloorPlanBackground(svg) {
    // Add stage/head table area
    const stage = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    stage.setAttribute('x', '50');
    stage.setAttribute('y', '50');
    stage.setAttribute('width', '700');
    stage.setAttribute('height', '80');
    stage.setAttribute('fill', '#E8F5E8');
    stage.setAttribute('stroke', '#4A7C59');
    stage.setAttribute('stroke-width', '2');
    stage.setAttribute('rx', '10');
    svg.appendChild(stage);
    
    // Add stage label
    const stageLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    stageLabel.setAttribute('x', '400');
    stageLabel.setAttribute('y', '95');
    stageLabel.setAttribute('text-anchor', 'middle');
    stageLabel.setAttribute('font-family', 'Inter, sans-serif');
    stageLabel.setAttribute('font-size', '16');
    stageLabel.setAttribute('font-weight', '600');
    stageLabel.setAttribute('fill', '#2D5016');
    stageLabel.textContent = 'Bàn Chính / Sân Khấu';
    svg.appendChild(stageLabel);
    
    // Add dance floor
    const danceFloor = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    danceFloor.setAttribute('cx', '400');
    danceFloor.setAttribute('cy', '350');
    danceFloor.setAttribute('r', '80');
    danceFloor.setAttribute('fill', '#F8F9FA');
    danceFloor.setAttribute('stroke', '#DEE2E6');
    danceFloor.setAttribute('stroke-width', '2');
    danceFloor.setAttribute('stroke-dasharray', '5,5');
    svg.appendChild(danceFloor);
    
    // Add dance floor label
    const danceLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    danceLabel.setAttribute('x', '400');
    danceLabel.setAttribute('y', '355');
    danceLabel.setAttribute('text-anchor', 'middle');
    danceLabel.setAttribute('font-family', 'Inter, sans-serif');
    danceLabel.setAttribute('font-size', '14');
    danceLabel.setAttribute('fill', '#6C757D');
    danceLabel.textContent = 'Sàn Nhảy';
    svg.appendChild(danceLabel);
}

// Add individual table to floor plan
function addTableToFloorPlan(svg, table) {
    const tableGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tableGroup.setAttribute('class', 'table');
    tableGroup.setAttribute('data-table', table.number);
    
    // Create table circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', table.x);
    circle.setAttribute('cy', table.y);
    circle.setAttribute('r', table.radius || 30);
    
    // Create table label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', table.x);
    text.setAttribute('y', table.y);
    text.textContent = table.number;
    
    tableGroup.appendChild(circle);
    tableGroup.appendChild(text);
    svg.appendChild(tableGroup);
    
    // Add click event for table interaction
    tableGroup.addEventListener('click', () => {
        // Optional: Add table click functionality
        console.log(`Clicked on ${table.number}`);
    });
}

// Global variable for highlight intensity
let highlightIntensity = 'high'; // Default to medium intensity

// Highlight specific table
function highlightTable(tableNumber) {
    // Remove existing highlights
    document.querySelectorAll('.table').forEach(table => {
        table.classList.remove('highlighted', 'intensity-low', 'intensity-medium', 'intensity-high');
    });
    
    // Add highlight to target table
    const targetTable = document.querySelector(`[data-table="${tableNumber}"]`);
    if (targetTable) {
        targetTable.classList.add('highlighted', `intensity-${highlightIntensity}`);
    }
}

// Function to set table highlight intensity
function setTableHighlightIntensity(intensity) {
    if (!['low', 'medium', 'high'].includes(intensity)) {
        console.warn('Invalid intensity level. Use "low", "medium", or "high".');
        return;
    }
    
    highlightIntensity = intensity;
    
    // Update currently highlighted table if any
    const currentHighlighted = document.querySelector('.table.highlighted');
    if (currentHighlighted) {
        // Remove old intensity classes
        currentHighlighted.classList.remove('intensity-low', 'intensity-medium', 'intensity-high');
        // Add new intensity class
        currentHighlighted.classList.add(`intensity-${intensity}`);
    }
    
    console.log(`Table highlight intensity set to: ${intensity}`);
}

// Check in functionality with Google Sheets integration
async function checkIn() {
    if (!currentGuest) return;
    
    const checkInBtn = document.getElementById('checkInBtn');
    const originalText = checkInBtn.textContent;
    
    // Show loading state
    checkInBtn.innerHTML = '<span class="loading"></span> Đang check in...';
    checkInBtn.disabled = true;
    
    try {
        // Send check-in data to Google Sheets
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'checkin',
                guestId: currentGuest.id,
                guestName: currentGuest.name,
                table: currentGuest.table,
                deviceId: getDeviceId()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Also store in localStorage as backup
            const checkInData = {
                id: currentGuest.id,
                name: currentGuest.name,
                table: currentGuest.table,
                timestamp: new Date().toISOString(),
                deviceId: getDeviceId()
            };
            localStorage.setItem(`checkedIn_${currentGuest.id}`, JSON.stringify(checkInData));
            
            // Update UI
            await updateCheckInStatus(currentGuest);
            
            // Show success modal
            showSuccessModal();
        } else {
            throw new Error(result.error || 'Check-in failed');
        }
    } catch (error) {
        console.error('Check-in error:', error);
        
        // Fallback to localStorage only
        const checkInData = {
            id: currentGuest.id,
            name: currentGuest.name,
            table: currentGuest.table,
            timestamp: new Date().toISOString(),
            deviceId: getDeviceId()
        };
        localStorage.setItem(`checkedIn_${currentGuest.id}`, JSON.stringify(checkInData));
        
        // Update UI
        await updateCheckInStatus(currentGuest);
        
        // Show success modal with warning
        showSuccessModal();
        console.warn('Check-in saved locally only due to network error');
    }
    
    // Reset button
    checkInBtn.textContent = originalText;
}

// Update check-in status display with Google Sheets integration
async function updateCheckInStatus(guest) {
    const checkInBtn = document.getElementById('checkInBtn');
    const checkInStatus = document.getElementById('checkInStatus');
    
    try {
        // First check Google Sheets
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'checkStatus',
                guestId: guest.id
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.isCheckedIn) {
            checkInBtn.textContent = 'Đã Check In';
            checkInBtn.disabled = true;
            
            // Get table status to show other checked-in guests
            await showTableStatus(guest.table);
            
            checkInStatus.innerHTML = `
                <div class="already-checked">
                    ✓ Quý khách đã check in thành công
                </div>
            `;
            checkInStatus.className = 'check-in-status already-checked';
            return;
        }
    } catch (error) {
        console.error('Error checking status from Google Sheets:', error);
    }
    
    // Fallback to localStorage check
    const checkInData = localStorage.getItem(`checkedIn_${guest.id}`);
    if (checkInData) {
        const data = JSON.parse(checkInData);
        const checkInTime = new Date(data.timestamp).toLocaleString();
        
        checkInBtn.textContent = 'Đã Check In';
        checkInBtn.disabled = true;
        
        checkInStatus.innerHTML = `
            <div class="already-checked">
                ✓ Quý khách đã check in vào ${checkInTime} (offline)
            </div>
        `;
        checkInStatus.className = 'check-in-status already-checked';
    } else {
        checkInBtn.textContent = 'Check In';
        checkInBtn.disabled = false;
        checkInStatus.innerHTML = '';
        checkInStatus.className = 'check-in-status';
        
        // Show table status for current table
        await showTableStatus(guest.table);
    }
}

// Show who else has checked in at the same table
async function showTableStatus(tableNumber) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'getTableStatus',
                table: tableNumber
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.checkIns.length > 0) {
            const guestInfo = document.getElementById('guestInfo');
            const tableStatusHtml = `
                <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
                    <h4 style="margin: 0 0 10px 0; color: #2D5016;">Khách đã check-in tại bàn này:</h4>
                    ${result.checkIns.map(checkin => `
                        <div style="margin: 5px 0; color: #666;">
                            ✅ ${checkin.guestName} 
                            <small>(${new Date(checkin.timestamp).toLocaleTimeString()})</small>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Add table status to guest info
            if (!guestInfo.innerHTML.includes('Khách đã check-in tại bàn này:')) {
                guestInfo.innerHTML += tableStatusHtml;
            }
        }
    } catch (error) {
        console.error('Error getting table status:', error);
    }
}

// Generate or get device ID
function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}

// Go back to search
function goBack() {
    document.getElementById('searchSection').style.display = 'block';
    document.getElementById('floorPlanSection').style.display = 'none';
    
    // Clear search input
    document.getElementById('guestName').value = '';
    document.getElementById('guestName').focus();
    
    // Remove table highlights and intensity classes
    document.querySelectorAll('.table').forEach(table => {
        table.classList.remove('highlighted', 'intensity-low', 'intensity-medium', 'intensity-high');
    });
    
    // Reset current guest
    currentGuest = null;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Modal functions
function showErrorModal() {
    document.getElementById('errorModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('errorModal').style.display = 'none';
}

function showSuccessModal() {
    document.getElementById('successModal').style.display = 'block';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Utility function to show general errors
function showError(message) {
    alert(message); // Simple alert for now, could be enhanced with custom modal
}

// Debug function to get all checked-in guests (for testing)
function getCheckedInGuests() {
    const checkedIn = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('checkedIn_')) {
            const data = JSON.parse(localStorage.getItem(key));
            checkedIn.push(data);
        }
    }
    return checkedIn;
}

// Debug function to clear all check-ins (for testing)
function clearAllCheckIns() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('checkedIn_')) {
            keys.push(key);
        }
    }
    keys.forEach(key => localStorage.removeItem(key));
    console.log('Đã xóa tất cả check-ins');
}

// Autocomplete functionality
function handleAutocompleteInput(value) {
    // Clear existing timeout
    if (autocompleteTimeout) {
        clearTimeout(autocompleteTimeout);
    }
    
    // Reset selection
    selectedSuggestionIndex = -1;
    
    // Debounce input to avoid excessive filtering
    autocompleteTimeout = setTimeout(() => {
        if (value.length >= 2) {
            showAutocomplete(value);
        } else {
            hideAutocomplete();
        }
    }, 150);
}

function showAutocomplete(searchValue) {
    suggestions = getMatchingSuggestions(searchValue);
    
    if (suggestions.length === 0) {
        hideAutocomplete();
        return;
    }
    
    const dropdown = document.getElementById('autocompleteDropdown');
    dropdown.innerHTML = '';
    
    suggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.innerHTML = `
            <span class="guest-name">${suggestion.name}</span>
            <span class="table-info">${suggestion.description}</span>
        `;
        
        // Add click handler
        item.addEventListener('click', () => {
            selectSuggestion(index);
        });
        
        dropdown.appendChild(item);
    });
    
    dropdown.classList.add('show');
}

function hideAutocomplete() {
    const dropdown = document.getElementById('autocompleteDropdown');
    dropdown.classList.remove('show');
    selectedSuggestionIndex = -1;
    suggestions = [];
}

function getMatchingSuggestions(searchValue) {
    const normalizedSearch = searchValue.toLowerCase().trim();
    const matches = [];
    
    // Get all guest entries
    const guestEntries = Object.entries(guestData);
    
    // Exact matches first
    guestEntries.forEach(([name, guestInfo]) => {
        if (name.toLowerCase().startsWith(normalizedSearch)) {
            matches.push({ 
                name, 
                table: guestInfo.table, 
                description: guestInfo.description, 
                priority: 1 
            });
        }
    });
    
    // Partial matches
    guestEntries.forEach(([name, guestInfo]) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes(normalizedSearch) && !lowerName.startsWith(normalizedSearch)) {
            matches.push({ 
                name, 
                table: guestInfo.table, 
                description: guestInfo.description, 
                priority: 2 
            });
        }
    });
    
    // Word matches
    const searchWords = normalizedSearch.split(' ');
    guestEntries.forEach(([name, guestInfo]) => {
        const nameWords = name.toLowerCase().split(' ');
        const hasWordMatch = searchWords.some(searchWord => 
            nameWords.some(nameWord => 
                nameWord.startsWith(searchWord) && searchWord.length > 1
            )
        );
        
        if (hasWordMatch && !matches.some(m => m.name === name)) {
            matches.push({ 
                name, 
                table: guestInfo.table, 
                description: guestInfo.description, 
                priority: 3 
            });
        }
    });
    
    // Sort by priority and limit results
    return matches
        .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
        .slice(0, 6);
}

function handleAutocompleteKeydown(e) {
    const dropdown = document.getElementById('autocompleteDropdown');
    
    if (!dropdown.classList.contains('show') || suggestions.length === 0) {
        return;
    }
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
            updateSuggestionHighlight();
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
            updateSuggestionHighlight();
            break;
            
        case 'Escape':
            e.preventDefault();
            hideAutocomplete();
            break;
            
        case 'Tab':
            if (selectedSuggestionIndex >= 0) {
                e.preventDefault();
                selectSuggestion(selectedSuggestionIndex);
            }
            break;
    }
}

function updateSuggestionHighlight() {
    const items = document.querySelectorAll('.autocomplete-item');
    
    items.forEach((item, index) => {
        if (index === selectedSuggestionIndex) {
            item.classList.add('highlighted');
        } else {
            item.classList.remove('highlighted');
        }
    });
}

function selectSuggestion(index) {
    if (index >= 0 && index < suggestions.length) {
        const suggestion = suggestions[index];
        document.getElementById('guestName').value = suggestion.name;
        hideAutocomplete();
        
        // Automatically search for the selected guest
        setTimeout(() => {
            searchGuest();
        }, 100);
    }
}

// Make debug functions and intensity control available globally for testing
window.getCheckedInGuests = getCheckedInGuests;
window.clearAllCheckIns = clearAllCheckIns;
window.setTableHighlightIntensity = setTableHighlightIntensity;
