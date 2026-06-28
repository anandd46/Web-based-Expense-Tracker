import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

app = Flask(__name__)
CORS(app)  # Enable CORS for backend communication

# -------------------------------------------------------------
# AI Module 1: Smart Category Prediction
# -------------------------------------------------------------

# Training corpus for quick in-memory classification
training_data = [
    # Food
    ("mcdonalds", "Food"), ("pizza hut", "Food"), ("burger king", "Food"), ("starbucks coffee", "Food"),
    ("swiggy delivery", "Food"), ("zomato food", "Food"), ("kfc meal", "Food"), ("restaurant dinner", "Food"),
    ("subway sandwich", "Food"), ("grocery store supermarket", "Food"), ("bakery bread cakes", "Food"),
    ("cafe latte breakfast", "Food"), ("diner burger fries", "Food"), ("food panda delivery", "Food"),
    # Travel
    ("uber ride taxi", "Travel"), ("lyft transport cab", "Travel"), ("ola cabs taxi", "Travel"),
    ("petrol gas refuel", "Travel"), ("shell diesel fuel", "Travel"), ("train ticket fare", "Travel"),
    ("airline flight ticket booking", "Travel"), ("bus ticket transit", "Travel"), ("toll gate fee", "Travel"),
    ("hotel stay room airbnb", "Travel"), ("metro subway card recharge", "Travel"), ("parking ticket garage", "Travel"),
    # Shopping
    ("amazon order online", "Shopping"), ("walmart items retail", "Shopping"), ("target store shopping", "Shopping"),
    ("ebay online buy bidding", "Shopping"), ("nike shoes apparel", "Shopping"), ("zara fashion apparel clothing", "Shopping"),
    ("hm clothing jackets store", "Shopping"), ("electronics computer laptop buying", "Shopping"),
    ("mall boutique purchases", "Shopping"), ("home depot hardware tools", "Shopping"), ("ikea furniture table", "Shopping"),
    # Education
    ("udemy courses python javascript", "Education"), ("coursera specialization certificate", "Education"),
    ("college tuition fee semester", "Education"), ("textbook store academic books", "Education"),
    ("bootcamp coding training fee", "Education"), ("school fees books admission", "Education"),
    ("edx lectures learning program", "Education"), ("seminar workshop registration", "Education"),
    # Bills
    ("electricity electric power utility bill", "Bills"), ("water board utility tap bill", "Bills"),
    ("gas connection cooking fuel bill", "Bills"), ("broadband wifi internet network subscription", "Bills"),
    ("mobile recharge prepaid postpaid phone bill", "Bills"), ("rent house lease apartment monthly", "Bills"),
    ("netflix subscription streaming video", "Bills"), ("insurance premium auto health premium", "Bills"),
    # Medical
    ("pharmacy medicine drug prescription", "Medical"), ("hospital consultation charges", "Medical"),
    ("doctor checkup clinic fee", "Medical"), ("dentist teeth cleaning scaling", "Medical"),
    ("medical lab test blood scan reports", "Medical"), ("eye care glasses optician", "Medical"),
    # Entertainment
    ("spotify music subscription stream", "Entertainment"), ("cinema movie tickets popcorn", "Entertainment"),
    ("concert tickets music band live", "Entertainment"), ("steam games online video game playstation", "Entertainment"),
    ("xbox live store game buy", "Entertainment"), ("bar beer pub drinks night out", "Entertainment"),
    ("clubbing dance night lounge entry fee", "Entertainment"), ("bowling arcade gaming center", "Entertainment"),
    # Investment
    ("mutual funds sip equity investment", "Investment"), ("stocks shares brokerage buy portfolio", "Investment"),
    ("bitcoin cryptocurrency trading buy", "Investment"), ("gold coin bars bullion purchase", "Investment"),
    ("fixed deposit saving bond certificate", "Investment"), ("real estate property land advance deposit", "Investment"),
    # Other
    ("atm cash withdrawal bank charges", "Other"), ("unknown wire transfer incoming outgoing", "Other"),
    ("general service charges fee", "Other"), ("lost card fee processing charge", "Other")
]

# Separate features and labels
X_train = [item[0] for item in training_data]
y_train = [item[1] for item in training_data]

# Create standard TF-IDF Naive Bayes pipeline
model = make_pipeline(TfidfVectorizer(token_pattern=r'(?u)\b\w+\b'), MultinomialNB(alpha=0.1))
# Train the model
model.fit(X_train, y_train)


@app.route('/predict-category', methods=['POST'])
def predict_category():
    """
    Takes transaction text description and predicts category.
    Payload: { "text": "Pizza Hut 450" }
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"success": False, "error": "Missing 'text' in request body"}), 400

        text = data['text'].lower()
        
        # Perform prediction and get probability scores
        predicted_category = model.predict([text])[0]
        probabilities = model.predict_proba([text])[0]
        max_prob_idx = np.argmax(probabilities)
        confidence = float(probabilities[max_prob_idx])

        return jsonify({
            "category": predicted_category,
            "confidence": round(confidence, 2)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------------------------------------------------
# AI Module 2: Spending Analysis
# -------------------------------------------------------------

@app.route('/spending-analysis', methods=['POST'])
def analyze_spending():
    """
    Analyzes current month expenditures compared to the previous month.
    Payload: {
        "current_month": {"Food": 450, "Travel": 200},
        "previous_month": {"Food": 300, "Travel": 250}
    }
    """
    try:
        data = request.get_json()
        if not data or 'current_month' not in data or 'previous_month' not in data:
            return jsonify({"success": False, "error": "Missing current_month or previous_month data"}), 400

        current = data['current_month']
        previous = data['previous_month']

        insights = []
        alerts = False

        # Compare category-wise
        all_categories = set(list(current.keys()) + list(previous.keys()))

        for cat in all_categories:
            cur_val = current.get(cat, 0)
            prev_val = previous.get(cat, 0)

            if prev_val > 0:
                diff_pct = ((cur_val - prev_val) / prev_val) * 100
                if diff_pct > 15:  # spending increased by more than 15%
                    insights.append(f"You spent {round(diff_pct, 1)}% more on {cat} compared to last month.")
                    if diff_pct > 30:
                        alerts = True
                elif diff_pct < -15:  # spending decreased by more than 15%
                    insights.append(f"Great job! You cut down {cat} spending by {round(abs(diff_pct), 1)}%.")
            elif cur_val > 0:
                insights.append(f"You logged new spending in {cat} of ₹{cur_val} this month.")

        if not insights:
            insights.append("Your spending trends are matching your previous month patterns. Steady budget!")

        return jsonify({
            "analysis": " ".join(insights[:3]),  # Send up to top 3 insights
            "alert": alerts
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------------------------------------------------
# AI Module 3: Budget Prediction
# -------------------------------------------------------------

@app.route('/budget-prediction', methods=['POST'])
def predict_budget():
    """
    Predicts next month's total spending using linear regression trend lines.
    Payload: { "history": [1000, 1200, 1150, 1300] }
    """
    try:
        data = request.get_json()
        if not data or 'history' not in data:
            return jsonify({"success": False, "error": "Missing historical data history"}), 400

        history = data['history']
        if not isinstance(history, list) or len(history) == 0:
            return jsonify({"success": False, "error": "History must be a non-empty list of values"}), 400

        # Run linear regression if at least 2 historical values exist
        n = len(history)
        if n >= 2:
            x = np.arange(n)
            y = np.array(history)
            slope, intercept = np.polyfit(x, y, 1)
            predicted_val = slope * n + intercept
            # Ensure we don't predict a negative expenditure
            predicted_val = max(predicted_val, 10.0)
        else:
            # Fallback to single value + 5% increase or default seed
            predicted_val = history[0] * 1.05

        return jsonify({
            "predicted_spending": round(float(predicted_val), 2),
            "trend": "upward" if (n >= 2 and slope > 0) else ("downward" if (n >= 2 and slope < 0) else "flat")
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------------------------------------------------
# AI Module 4: Smart Financial Suggestions
# -------------------------------------------------------------

@app.route('/suggestions', methods=['POST'])
def get_suggestions():
    """
    Examines income, expenses, and category breakdown to offer recommendations.
    Payload: {
        "income": 5000,
        "total_expenses": 3200,
        "categories": { "Food": 800, "Entertainment": 400 },
        "savings_goal": 1000
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Missing request body"}), 400

        income = float(data.get('income', 0))
        total_expenses = float(data.get('total_expenses', 0))
        categories = data.get('categories', {})
        savings_goal = float(data.get('savings_goal', income * 0.2))

        suggestions = []

        # 1. Budget Ratio Analysis (50/30/20 rule fallback)
        if income > 0:
            expense_ratio = (total_expenses / income) * 100
            savings = income - total_expenses
            
            if expense_ratio > 80:
                suggestions.append("Critical: Your monthly expenses consume over 80% of your income. Consider looking for high-cost leaks in non-essential categories.")
            elif expense_ratio > 50:
                suggestions.append("Alert: You are spending more than 50% of your income. To build a robust safety net, try to save at least 20%.")
            else:
                suggestions.append("Great job! Your overall spending is well within safe thresholds. You have healthy savings potential.")

            if savings < savings_goal:
                shortfall = savings_goal - savings
                suggestions.append(f"Shortfall: You are off by ₹{round(shortfall, 2)} from your 20% savings target of ₹{round(savings_goal, 2)} this month.")
            else:
                suggestions.append("Success: You met your monthly savings target! Consider moving the surplus into long-term investments.")
        else:
            suggestions.append("Note: Add your monthly income sources to generate tailored budget threshold analyses.")

        # 2. Category Leaks Analysis
        highest_cat = None
        highest_val = 0
        for cat, val in categories.items():
            if val > highest_val:
                highest_val = val
                highest_cat = cat

        if highest_cat and highest_val > 0:
            if highest_cat == 'Food' and highest_val > (income * 0.15 if income > 0 else 300):
                suggestions.append("Suggestion: Your dining and food expenses are quite high. Cooking at home or meal prepping can save significant cash.")
            elif highest_cat == 'Entertainment' and highest_val > (income * 0.1 if income > 0 else 150):
                suggestions.append("Suggestion: Entertainment expenses are elevated. Review recurring subscriptions and seek low-cost weekend alternatives.")
            elif highest_cat == 'Shopping' and highest_val > (income * 0.15 if income > 0 else 250):
                suggestions.append("Suggestion: Shopping spending is your top category. Consider the '24-hour rule' before making non-essential purchases.")
            elif highest_cat == 'Bills':
                suggestions.append("Suggestion: Utility bills are your highest expense. Check for cheaper subscription plans or optimize energy usage.")
            else:
                suggestions.append(f"Tip: {highest_cat} is your largest expense (₹{highest_val}). Review if these expenses can be reduced or deferred.")

        # 3. Investment habit suggestion
        investment_val = categories.get('Investment', 0)
        if investment_val == 0:
            suggestions.append("Investment Tip: You logged zero investments this month. Start a monthly micro-investment or SIP in mutual funds or index funds.")
        else:
            suggestions.append(f"Investment: Glad to see you investing ₹{investment_val}! Consistency is the key to compounding interest.")

        return jsonify({
            "suggestions": suggestions
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------------------------------------------------
# Microservice Health Check
# -------------------------------------------------------------
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"success": True, "service": "SmartExpense-AI-Microservice", "status": "Running"})


if __name__ == '__main__':
    port = int(os.environ.get('PORT_AI', 5001))
    print(f"Starting Python AI microservice on port {port}...")
    app.run(host='0.0.0.0', port=port)
