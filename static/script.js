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
    table.innerHTML = `
        <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Catégorie</th>
            <th>Montant</th>
            <th>Type</th>
        </tr>
    `;

    transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(transaction => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td class="${transaction.type === 'expense' ? 'text-danger' : 'text-success'}">
                    ${formatCurrency(transaction.amount)}
                </td>
                <td>${transaction.type === 'expense' ? 'Dépense' : 'Revenu'}</td>
            `;
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
        type: 'pie'
    }];

    const layout = {
        title: 'Répartition des dépenses par catégorie',
        height: 400,
        showlegend: true
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
        } else {
            console.error('Erreur lors de l\'ajout de la transaction');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
});

// Chargement initial des données
document.addEventListener('DOMContentLoaded', loadTransactions);