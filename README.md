# Gestionnaire de Budget Personnel

Une application web pour gérer facilement votre budget personnel et suivre vos dépenses.

## Fonctionnalités

- Suivi des dépenses et revenus
- Catégorisation automatique des transactions
- Visualisation des données avec des graphiques
- Définition d'objectifs budgétaires
- Alertes pour les dépassements de budget
- Export des données au format CSV

## Technologies utilisées

- Frontend: HTML, CSS, JavaScript
- Backend: Python (Flask)
- Base de données: SQLite
- Visualisation: Chart.js

## Installation

1. Cloner le repository
```bash
git clone https://github.com/AbdoulDiouf2/personal-budget-tracker.git
cd personal-budget-tracker
```

2. Créer un environnement virtuel Python
```bash
python -m venv venv
source venv/bin/activate  # Sur Linux/Mac
# ou
venv\Scripts\activate  # Sur Windows
```

3. Installer les dépendances
```bash
pip install -r requirements.txt
```

4. Lancer l'application
```bash
python app.py
```

## Structure du projet

```
personal-budget-tracker/
├── app.py              # Application Flask principale
├── requirements.txt    # Dépendances Python
├── static/            
│   └── style.css      # Styles CSS
├── templates/
│   └── index.html     # Page principale
└── README.md          # Documentation
```

## Utilisation

1. Accédez à l'application via `http://localhost:5000`
2. Ajoutez vos transactions (revenus et dépenses)
3. Consultez les graphiques et statistiques
4. Exportez vos données si nécessaire

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Forker le projet
2. Créer une branche pour votre fonctionnalité
3. Soumettre une pull request

## Licence

Ce projet est sous licence MIT.