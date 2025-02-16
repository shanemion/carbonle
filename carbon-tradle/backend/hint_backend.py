from flask import Flask, request, jsonify
from openai import OpenAI
import os

app = Flask(__name__)

# Initialize the client with your API key
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Define your system prompt (developer message in this new interface)
SYSTEM_PROMPT = """
You are a helpful hint generator for a geography-based game focused on greenhouse gas emissions.
When a user makes a guess for a country, provide a concise hint related to greenhouse gas emissions that helps them get closer to the actual target country without revealing the answer directly.
Focus on aspects like emissions sources, comparisons to the guessed country, or climate-related policies of the target country.
Avoid giving away the answer directly. Keep hints brief and helpful. Do not ever give the actual country name in the hint.
"""

@app.route('/get_hint', methods=['POST'])
def get_hint():
    data = request.get_json()
    guess = data.get('guess')
    country = data.get('country')
    
    if not guess or not country:
        return jsonify({"error": "Both 'guess' and 'country' are required."}), 400

    # Prepare messages using the new roles (using "developer" for system instructions)
    messages = [
        {"role": "developer", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"My guess is '{guess}' and the correct country is '{country}'. Can you provide a hint to help me get closer to the correct answer?"}
    ]

    try:
        # Create a completion using the new client interface.
        completion = client.chat.completions.create(
            model="o3-mini",  # Change to your desired model if needed.
            messages=messages,
        )

        # Access the content attribute directly
        suggestion = completion.choices[0].message.content
        return jsonify({"suggestion": suggestion})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
