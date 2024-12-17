// Fonctions pour gérer les transactions
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        const transactions = await response.json();
        updateDashboard(transactions);
        updateTransactionsList(transactions);
        updateExpensesChart(transactions);
    } catch (error) {
        console.error('Erreur lors du chargement des transactions:', error);
    }
}

function updateDashboard(transactions) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = transactions
        .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

    document.getElementById('current-balance').textContent = formatCurrency(totalBalance);
    document.getElementById('monthly-income').textContent = formatCurrency(monthlyIncome);
    document.getElementById('monthly-expenses').textContent = formatCurrency(monthlyExpenses);
}

function updateTransactionsList(transactions) {
    const listElement = document.getElementById('transactions-list');
    listElement.innerHTML = '';

    const table = document.createElement('table');
    table.classList.add('transactions-table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Catégorie</th>
                <th>Montant</th>
                <th>Type</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(transaction.date).toLocaleDateString('fr-FR')}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td class="${transaction.type === 'expense' ? 'text-danger' : 'text-success'}">
                    ${formatCurrency(transaction.amount)}
                </td>
                <td>${transaction.type === 'expense' ? 'Dépense' : 'Revenu'}</td>
            `;
            tbody.appendChild(row);
        });

    listElement.appendChild(table);
}

function updateExpensesChart(transactions) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyExpenses = transactions
        .filter(t => {
            const transactionDate = new Date(t.date);
            return t.type === 'expense' &&
                   transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear;
        });

    const expensesByCategory = {};
    monthlyExpenses.forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    const data = [{
        values: Object.values(expensesByCategory),
        labels: Object.keys(expensesByCategory),
        type: 'pie',
        hole: 0.4,
        marker: {
            colors: [
                '#2ecc71',
                '#3498db',
                '#9b59b6',
                '#f1c40f',
                '#e74c3c',
                '#1abc9c'
            ]
        }
    }];

    const layout = {
        title: 'Répartition des dépenses par catégorie',
        height: 400,
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.2
        }
    };

    Plotly.newPlot('expenses-chart', data, layout);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

// Gestionnaire de formulaire
document.getElementById('transaction-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        type: document.getElementById('type').value
    };

    try {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            document.getElementById('transaction-form').reset();
            loadTransactions();
            showNotification('Transaction ajoutée avec succès', 'success');
        } else {
            showNotification('Erreur lors de l\'ajout de la transaction', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la communication avec le serveur', 'error');
    }
});

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.classList.add('notification', `notification-${type}`);
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Chargement initial des données
document.addEventListener('DOMContentLoaded', loadTransactions);