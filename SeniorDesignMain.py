
from flask import Flask, request, jsonify, render_template
from groq import Groq
from pathlib import Path

# Initialize Flask
app = Flask(__name__)

# Read API key
project_folder = Path(__file__).resolve().parent

with open(project_folder / "APIKey.txt", "r") as file:
    api_key = file.read().strip()

# Initialize Groq client
client = Groq(api_key=api_key)

# Home page
@app.route("/")
def home():
    return render_template("index.html")


# Chat endpoint
@app.route("/chat", methods=["POST"])
def chat():

    # Receive conversation history from JavaScript
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON request"}), 400

    messages = data.get("messages")

    # Validate message structure
    if (
        not isinstance(messages, list)
        or not messages
        or any(
            not isinstance(message, dict)
            or message.get("role") not in
                ("system", "user", "assistant")
            or not isinstance(message.get("content"), str)
            for message in messages
        )
        or messages[-1]["role"] != "user"
    ):
        return jsonify({"error": "Invalid messages"}), 400

    try:
        # Send messages to Groq
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages,
            temperature=1,
            max_completion_tokens=2048,
            top_p=1,
            reasoning_effort="medium",
            stream=False
        )

        # Extract AI response
        ai_response = completion.choices[0].message.content

        if not ai_response:
            return jsonify({"error": "Empty AI response"}), 502

        # Send response back to JavaScript
        return jsonify({
            "reply": ai_response
        })

    except Exception:
        app.logger.exception("Groq request failed")
        return jsonify({
            "error": "Unable to generate a response"
        }), 502


# Start Flask server
if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
