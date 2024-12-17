from flask import Flask, render_template, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pandas as pd
import io

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///budget.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(10), nullable=False)  # 'income' or 'expense'

class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)

class SavingsGoal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, default=0)
    deadline = db.Column(db.DateTime)
    description = db.Column(db.String(200))

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/transactions', methods=['GET', 'POST'])
def handle_transactions():
    if request.method == 'POST':
        data = request.json
        new_transaction = Transaction(
            description=data['description'],
            amount=data['amount'],
            category=data['category'],
            type=data['type']
        )
        db.session.add(new_transaction)
        db.session.commit()
        return jsonify({'message': 'Transaction added successfully'})
    
    transactions = Transaction.query.all()
    return jsonify([{
        'id': t.id,
        'date': t.date.strftime('%Y-%m-%d'),
        'description': t.description,
        'amount': t.amount,
        'category': t.category,
        'type': t.type
    } for t in transactions])

@app.route('/api/transactions/export', methods=['GET'])
def export_transactions():
    transactions = Transaction.query.all()
    
    # Créer un DataFrame pandas avec les transactions
    df = pd.DataFrame([
        {
            'Date': t.date.strftime('%Y-%m-%d'),
            'Description': t.description,
            'Montant': t.amount,
            'Catégorie': t.category,
            'Type': 'Dépense' if t.type == 'expense' else 'Revenu'
        } for t in transactions
    ])
    
    # Créer un buffer en mémoire pour le fichier Excel
    output = io.BytesIO()
    
    # Écrire le DataFrame dans le buffer
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Transactions', index=False)
        
        # Ajuster la largeur des colonnes
        worksheet = writer.sheets['Transactions']
        for i, col in enumerate(df.columns):
            column_len = max(df[col].astype(str).apply(len).max(),
                           len(col)) + 2
            worksheet.set_column(i, i, column_len)
    
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='transactions.xlsx'
    )

@app.route('/api/budgets', methods=['GET', 'POST'])
def handle_budgets():
    if request.method == 'POST':
        data = request.json
        new_budget = Budget(
            category=data['category'],
            amount=data['amount'],
            month=data['month'],
            year=data['year']
        )
        db.session.add(new_budget)
        db.session.commit()
        return jsonify({'message': 'Budget target added successfully'})
    
    budgets = Budget.query.all()
    return jsonify([{
        'id': b.id,
        'category': b.category,
        'amount': b.amount,
        'month': b.month,
        'year': b.year
    } for b in budgets])

@app.route('/api/savings', methods=['GET', 'POST'])
def handle_savings():
    if request.method == 'POST':
        data = request.json
        new_goal = SavingsGoal(
            target_amount=data['target_amount'],
            deadline=datetime.strptime(data['deadline'], '%Y-%m-%d'),
            description=data.get('description', '')
        )
        db.session.add(new_goal)
        db.session.commit()
        return jsonify({'message': 'Savings goal added successfully'})
    
    goals = SavingsGoal.query.all()
    return jsonify([{
        'id': g.id,
        'target_amount': g.target_amount,
        'current_amount': g.current_amount,
        'deadline': g.deadline.strftime('%Y-%m-%d') if g.deadline else None,
        'description': g.description
    } for g in goals])

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    transactions = Transaction.query.all()
    
    # Calculer les statistiques mensuelles
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    monthly_stats = {
        'total_income': sum(t.amount for t in transactions 
                          if t.type == 'income' and 
                          t.date.month == current_month and 
                          t.date.year == current_year),
        'total_expenses': sum(t.amount for t in transactions 
                           if t.type == 'expense' and 
                           t.date.month == current_month and 
                           t.date.year == current_year),
        'categories': {}
    }
    
    # Calculer les dépenses par catégorie
    for t in transactions:
        if t.type == 'expense' and t.date.month == current_month and t.date.year == current_year:
            if t.category not in monthly_stats['categories']:
                monthly_stats['categories'][t.category] = 0
            monthly_stats['categories'][t.category] += t.amount
    
    return jsonify(monthly_stats)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)