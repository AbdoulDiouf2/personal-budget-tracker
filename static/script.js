// Configuration du thème
const themeToggle = document.getElementById('theme-toggle');
let darkMode = false;

themeToggle.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-theme');
    themeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    updateChartTheme();
});

// Gestion des transactions
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        const transactions = await response.json();
        updateDashboard(transactions);
        updateTransactionsList(transactions);
        updateExpensesChart(transactions);
        updateSavingsProgress(transactions);
    } catch (error) {
        showNotification('Erreur lors du chargement des données', 'error');
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

    const savings = transactions
        .filter(t => t.category === 'économies')
        .reduce((sum, t) => sum + t.amount, 0);

    document.getElementById('current-balance').textContent = formatCurrency(totalBalance);
    document.getElementById('monthly-income').textContent = formatCurrency(monthlyIncome);
    document.getElementById('monthly-expenses').textContent = formatCurrency(monthlyExpenses);
    document.getElementById('savings').textContent = formatCurrency(savings);

    // Mise à jour des pourcentages de variation
    updateVariationBadges(monthlyIncome, monthlyExpenses, savings);
}

function updateVariationBadges(income, expenses, savings) {
    // Simule des variations pour la démo
    const variations = {
        income: ((income / 1000) * Math.random()).toFixed(1),
        expenses: ((expenses / 1000) * Math.random()).toFixed(1),
        savings: ((savings / 1000) * Math.random()).toFixed(1)
    };

    // Mise à jour des badges
    // TODO: Implémenter la logique réelle de calcul des variations
}

function updateTransactionsList(transactions) {
    const listElement = document.getElementById('transactions-list');
    listElement.innerHTML = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            </tbody>
        </table>
    `;

    const tbody = listElement.querySelector('tbody');
    transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(transaction.date).toLocaleDateString('fr-FR')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${transaction.description}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getCategoryColor(transaction.category)}-100 text-${getCategoryColor(transaction.category)}-800">
                        ${transaction.category}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'} font-medium">
                    ${formatCurrency(transaction.amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.type === 'expense' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                        ${transaction.type === 'expense' ? 'Dépense' : 'Revenu'}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
}

function updateExpensesChart(transactions) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyExpenses = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' &&
               transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
    });

    const expensesByCategory = {};
    const categoryColors = {
        'alimentation': '#2ecc71',
        'transport': '#3498db',
        'logement': '#9b59b6',
        'loisirs': '#f1c40f',
        'santé': '#e74c3c',
        'économies': '#1abc9c',
        'autres': '#95a5a6'
    };

    monthlyExpenses.forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    const data = [{
        type: 'pie',
        values: Object.values(expensesByCategory),
        labels: Object.keys(expensesByCategory),
        hole: 0.4,
        marker: {
            colors: Object.keys(expensesByCategory).map(category => categoryColors[category])
        },
        textinfo: 'label+percent',
        hoverinfo: 'label+value',
        textposition: 'outside'
    }];

    const layout = {
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.2
        },
        height: 400,
        margin: { t: 0, b: 0, l: 0, r: 0 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.newPlot('expenses-chart', data, layout, { responsive: true });
}

function updateSavingsProgress(transactions) {
    // TODO: Implémenter la logique de progression des économies
}

function getCategoryColor(category) {
    const colors = {
        'alimentation': 'green',
        'transport': 'blue',
        'logement': 'purple',
        'loisirs': 'yellow',
        'santé': 'red',
        'économies': 'indigo',
        'autres': 'gray'
    };
    return colors[category] || 'gray';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.classList.add(
        'fixed',
        'bottom-4',
        'right-4',
        'px-4',
        'py-2',
        'rounded-lg',
        'text-white',
        'transition-opacity',
        'duration-500',
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
    );
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Gestionnaire de formulaire
document.getElementById('transaction-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        type: document.querySelector('input[name="type"]:checked').value
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
        showNotification('Erreur lors de la communication avec le serveur', 'error');
    }
});

// Chargement initial des données
document.addEventListener('DOMContentLoaded', loadTransactions);
