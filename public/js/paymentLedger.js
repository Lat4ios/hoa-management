// Person data (embedded by EJS) 
const allPersons = JSON.parse(document.getElementById('personData').textContent);

// Payment modal (purpose -> redirect to /dues/:type)  
const addModal = document.getElementById('modal');

document.getElementById('openModal').onclick = () => {
    window.location.href = '/dues/association';
};

// Expense modal (purpose -> redirect to /expenses/:type)  
const addExpenseModal = document.getElementById('expenseModal');

document.getElementById('openExpenseModal').onclick = () => {
     window.location.href = '/expenses/utilities';
};

document.getElementById('cancelExpense').onclick = () => {
    addExpenseModal.classList.remove('active');
};

document.getElementById('continueExpense').onclick = () => {
    const purpose = document.getElementById('expensePurpose').value; 
    if(!purpose) { alert('Select a expense purpose.'); return; }

    console.log("Redirecting to:", `/expenses/${purpose}`);
    
    window.location.href = `/expenses/${purpose}`; 
}

// ── Generic modal close ───────────────────────────────────────────────────────
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ── Client-side table search + status filter ──────────────────────────────────
let activeStatusFilter = 'all';

function setStatusFilter(status, btn) {
    activeStatusFilter = status;
    document.querySelectorAll('.pay-filter-btn').forEach(b => b.classList.remove('pay-filter-active'));
    if (btn) btn.classList.add('pay-filter-active');
    filterTable();
}

function filterTable() {
    const q     = document.getElementById('searchInput').value.toLowerCase();
    const rows  = document.querySelectorAll('#paymentTable tbody tr');
    let visible = 0;
    rows.forEach(row => {
        const textMatch   = row.textContent.toLowerCase().includes(q);
        const statusMatch = activeStatusFilter === 'all' || row.dataset.status === activeStatusFilter;
        const match = textMatch && statusMatch;
        row.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    document.getElementById('visibleCount').textContent = visible;
}

// ── Payer search dropdown for Edit modal ─────────────────────────────────────
function initPayerSearch(mode) {
    const searchInput = document.getElementById(`${mode}_payer_search`);
    const dropdown    = document.getElementById(`${mode}_payer_dropdown`);
    const hiddenId    = document.getElementById(`${mode}_payer_id`);
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const query = this.value.trim().toLowerCase();
        hiddenId.value = '';
        dropdown.innerHTML = '';
        if (!query) { dropdown.style.display = 'none'; return; }

        const matches = allPersons.filter(p => p.full_name.toLowerCase().includes(query));
        if (!matches.length) { dropdown.style.display = 'none'; return; }

        matches.forEach(p => {
            const li = document.createElement('li');
            li.textContent = p.full_name;
            li.addEventListener('mousedown', function (e) {
                e.preventDefault();
                searchInput.value      = p.full_name;
                hiddenId.value         = p.person_id;
                dropdown.style.display = 'none';
            });
            dropdown.appendChild(li);
        });
        dropdown.style.display = 'block';
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => { dropdown.style.display = 'none'; }, 150);
    });
}

initPayerSearch('edit');

// ── View Details modal ────────────────────────────────────────────────────────
function openViewModal(btn) {
    const d        = btn.dataset;
    const paid     = parseFloat(d.paid)     || 0;
    const expected = parseFloat(d.expected) || 0;
    const datePaid = d.date
        ? new Date(d.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
        : '—';

    let status = 'Unpaid', statusClass = 'status-unpaid';
    if (paid > 0) {
        if (paid >= expected) { status = 'Paid';    statusClass = 'status-paid'; }
        else                  { status = 'Partial'; statusClass = 'status-partial'; }
    }

    const fmt = n => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

    document.getElementById('viewModalBody').innerHTML = `
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr><td style="padding:8px 0; color:#777; width:38%">Payer</td>     <td><strong>${d.payer || '—'}</strong></td></tr>
            <tr><td style="padding:8px 0; color:#777;">Purpose</td>    <td><span class="purpose-badge">${d.purpose}</span></td></tr>
            <tr><td style="padding:8px 0; color:#777;">Status</td>     <td><span class="payment-status ${statusClass}">${status}</span></td></tr>
            <tr><td style="padding:8px 0; color:#777;">Expected</td>   <td>&#8369; ${fmt(expected)}</td></tr>
            <tr><td style="padding:8px 0; color:#777;">Paid</td>       <td>&#8369; ${fmt(paid)}</td></tr>
            <tr><td style="padding:8px 0; color:#777;">Date Paid</td>  <td>${datePaid}</td></tr>
            <tr><td style="padding:8px 0; color:#777;">Method</td>     <td>${d.method}</td></tr>
            <tr><td style="padding:8px 0; color:#777;">Receipt #</td>  <td>${d.receipt || '—'}</td></tr>
            <tr><td style="padding:8px 0; color:#777;">Remarks</td>    <td>${d.remarks || '—'}</td></tr>
        </table>
    `;

    document.getElementById('viewModal').classList.add('active');
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function openEditModal(btn) {
    const d = btn.dataset;

    document.getElementById('edit_payment_id').value      = d.id;
    document.getElementById('edit_purpose').value         = d.purpose;
    document.getElementById('edit_amount_expected').value = d.expected;
    document.getElementById('edit_amount_paid').value     = d.paid;
    document.getElementById('edit_payment_method').value  = d.method;
    document.getElementById('edit_receipt_number').value  = d.receipt || '';
    document.getElementById('edit_remarks').value         = d.remarks || '';
    document.getElementById('edit_date_paid').value       = d.date ? d.date.slice(0, 10) : '';

    const person = allPersons.find(p => String(p.person_id) === String(d.paidby));
    document.getElementById('edit_payer_search').value = person ? person.full_name : '';
    document.getElementById('edit_payer_id').value     = d.paidby || '';

    document.getElementById('editModal').classList.add('active');
}

// ── Delete confirmation ───────────────────────────────────────────────────────
function confirmDelete(id, label) {
    document.getElementById('deleteLabel').textContent = label;
    document.getElementById('deleteModal').classList.add('active');

    document.getElementById('confirmDeleteBtn').onclick = async () => {
        try {
            const res  = await fetch(`/payments/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                window.location.href = '/payments?success=Payment+deleted+successfully.';
            } else {
                alert('Delete failed: ' + json.message);
            }
        } catch (e) {
            alert('Delete failed: ' + e.message);
        }
    };
}
