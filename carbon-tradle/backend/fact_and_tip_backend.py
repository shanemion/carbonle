from flask import Flask, request, jsonify
from openai import OpenAI
import os

app = Flask(__name__)

# Initialize the client with your API key.
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Endpoint to get a fun fact about a given sub-sector
@app.route('/get_fun_fact', methods=['POST'])
def get_fun_fact():
    data = request.get_json()
    subsector = data.get('subsector')
    
    if not subsector:
        return jsonify({'error': "Parameter 'subsector' is required."}), 400

    messages = [
        {"role": "developer", "content": "You are a knowledgeable environmental educator."},
        {"role": "user", "content": f"Share a fun fact about the '{subsector}' sub-sector, particularly in the context of carbon emissions or environmental impact."}
    ]

    try:
        completion = client.chat.completions.create(
            model="o3-mini",  
            messages=messages,
        )
        fun_fact = completion.choices[0].message.content
        return jsonify({'fun_fact': fun_fact})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint to get an emissions tip for a country based on sub-sector and emissions info
@app.route('/get_emission_tip', methods=['POST'])
def get_emission_tip():
    data = request.get_json()
    country = data.get('country')
    subsector = data.get('subsector')
    emissions_info = data.get('emissions_info')  # This could be any context data you have.

    if not country or not subsector or not emissions_info:
        return jsonify({'error': "Parameters 'country', 'subsector', and 'emissions_info' are required."}), 400

    messages = [
        {"role": "developer", "content": "You are an expert in environmental policy and sustainability. Your goal is to provide actionable advice."},
        {"role": "user", "content": (
            f"Country: {country}\n"
            f"Sub-sector: {subsector}\n"
            f"Emissions Data: {emissions_info}\n\n"
            "Based on this information, provide a relevant and very short practical tip to a regular person that they can do in their daily life to help reduce waste, emissions, and greenhouse gases."
        )}
    ]

    try:
        completion = client.chat.completions.create(
            model="o3-mini", 
            messages=messages,
        )
        tip = completion.choices[0].message.content
        return jsonify({'tip': tip})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
